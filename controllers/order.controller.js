import OrderModel from "../models/order.model.js";
import { validateAddress, createShipment } from '../utils/shiprocket.service.js';
import UserModel from '../models/user.model.js';
import OrderConfirmationEmail from "../utils/orderEmailTemplate.js";
import sendEmailFun from "../config/sendEmail.js";
import dotenv from 'dotenv';
import { getCache, setCache, delCache } from '../utils/redisUtil.js';
import AddressModel from "../models/address.model.js";
import ProductModel from "../models/product.modal.js";
import Razorpay from 'razorpay';
dotenv.config();
import crypto from "crypto";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrderController = async (req, res) => {
  try {
    const { userId, productIds, quantities, deliveryAddressId } = req.body;

    if (!userId || !productIds || !quantities || !deliveryAddressId) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: userId, productIds, quantities, deliveryAddressId",
      });
    }

    if (
      !Array.isArray(productIds) ||
      !Array.isArray(quantities) ||
      productIds.length !== quantities.length
    ) {
      return res.status(400).json({
        success: false,
        message: "productIds and quantities must be arrays of the same length",
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const address = await AddressModel.findById(deliveryAddressId);
    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery address not found" });
    }

    const isServiceable = await validateAddress(address.pincode);
    if (!isServiceable) {
      return res
        .status(400)
        .json({ success: false, message: "Address not serviceable" });
    }

    const products = await ProductModel.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) {
      return res
        .status(404)
        .json({ success: false, message: "Some products not found" });
    }

    const orders = [];
    let grandTotal = 0;

    for (let i = 0; i < productIds.length; i++) {
      const productId = productIds[i];
      const quantity = quantities[i];

      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Quantity for product ${productId} must be greater than zero`,
        });
      }

      const product = products.find((p) => p._id.toString() === productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${productId} not found`,
        });
      }

      const retailerId = product.createdBy;
      if (!retailerId) {
        return res.status(400).json({
          success: false,
          message: `Product ${productId} does not have a creator`,
        });
      }

      const retailer = await UserModel.findById(retailerId);
      if (!retailer) {
        return res.status(404).json({
          success: false,
          message: `Invalid retailer for product ${productId}`,
        });
      }

      const orderProducts = [
        {
          productId: productId,
          productTitle: product.name,
          quantity: quantity,
          price: product.price,
          image: product.images?.[0] || "",
          sub_total: product.price * quantity,
        },
      ];

      const totalAmt = orderProducts[0].sub_total;
      grandTotal += totalAmt;

      const order = await OrderModel.create({
        userId,
        products: orderProducts,
        delivery_address: deliveryAddressId,
        totalAmt,
        retailerId,
        payment_status: "PENDING",
        order_status: "pending",
      });

      orders.push(order);
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: grandTotal * 100, 
      currency: "INR",
      receipt: orders[0]._id.toString(),
      notes: {
        userId: userId.toString(),
        orderIds: orders.map((o) => o._id.toString()).join(","),
      },
    });

    await Promise.all(
      orders.map((o) => {
        o.razorpayOrderId = razorpayOrder.id;
        return o.save();
      })
    );

    await sendEmailFun({
      sendTo: user?.email,
      subject: "Order Confirmation",
      text: "",
      html: OrderConfirmationEmail(user?.name, orders[0]),
    });

    return res.status(200).json({
      success: true,
      orders,
      razorpayOrder, 
    });
  } catch (error) {
    console.error("createOrderController error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};


export const verifyPaymentController = async (req, res) => {
  try {
    const { razorpayPaymentId,razorpayOrderId,razorpaySignature } = req.body;

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message:
          "razorpayPaymentId, razorpayOrderId and razorpaySignature are required",
      });
    }

    const body = `${razorpayOrderId}|${razorpayPaymentId}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const orders = await OrderModel.find({
      razorpayOrderId: razorpayOrderId,
    });

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Orders not found for this payment",
      });
    }

    await Promise.all(
      orders.map((order) => {
        order.paymentId = razorpayPaymentId;
        order.payment_status = "COMPLETED";
        order.paymentStatus = "SUCCESS";
        return order.save();
      })
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      orders,
    });
  } catch (err) {
    console.error("verifyPaymentController error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

export async function getOrderDetailsController(request, response) {
    try {
        const { page, limit } = request.query;
        const cacheKey = 'order_list';
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return response.json(cachedData);
        }
        const orderlist = await OrderModel.find().sort({ createdAt: -1 }).populate('delivery_address userId').skip((page - 1) * limit).limit(parseInt(limit));
        const total = await OrderModel.countDocuments(orderlist);
        const responseData = {
            message: "order list",
            data: orderlist,
            error: false,
            success: true,
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        };
        await setCache(cacheKey, responseData);
        return response.json(responseData);
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function getUserOrderDetailsController(request, response) {
    try {
        const userId = request.userId;
        const { page, limit } = request.query;
        const cacheKey = `user_order_list_${userId}`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return response.json(cachedData);
        }
        const orderlist = await OrderModel.find({ userId: userId }).sort({ createdAt: -1 }).populate('delivery_address userId').skip((page - 1) * limit).limit(parseInt(limit));
        const orderTotal = await OrderModel.find({ userId: userId }).sort({ createdAt: -1 }).populate('delivery_address userId');
        const total = await orderTotal?.length;
        const responseData = {
            message: "order list",
            data: orderlist,
            error: false,
            success: true,
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        };
        await setCache(cacheKey, responseData);
        return response.json(responseData);
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function getTotalOrdersCountController(request, response) {
    try {
        const cacheKey = 'total_orders_count';
        const cachedCount = await getCache(cacheKey);
        if (cachedCount) {
            return response.status(200).json(cachedCount);
        }
        const ordersCount = await OrderModel.countDocuments();
        const responseData = {
            error: false,
            success: true,
            count: ordersCount
        };
        await setCache(cacheKey, responseData);
        return response.status(200).json(responseData);
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const updateOrderStatusController = async (request, response) => {
    try {
        const { id, order_status } = request.body;
        const order = await OrderModel.findById(id);
        if (!order) {
            return response.status(404).json({ message: "Order not found", error: true, success: false });
        }
        // If retailer approves, create shipment in Shiprocket
        let shipmentResult = null;
        if (order_status === 'approved') {
            // Prepare payload for Shiprocket
            const payload = {
                // Fill with required fields from order, retailer warehouse, and user delivery address
                // Example:
                order_id: order._id,
                pickup_postcode: order.products[0]?.retailerWarehousePincode, // You must ensure this is available
                delivery_postcode: order.delivery_address?.pincode,
                // ...other required Shiprocket fields
            };
            shipmentResult = await createShipment(payload);
        }
        // Update order status
        order.order_status = order_status;
        await order.save();
        // Invalidate order-related cache after updating order status
        await delCache('order_list');
        await delCache(`user_order_list_${order.userId}`);
        await delCache('total_orders_count');
        return response.json({
            message: "Update order status",
            success: true,
            error: false,
            shipment: shipmentResult,
            data: order
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }

}






export const totalSalesController = async (request, response) => {
    try {
        const currentYear = new Date().getFullYear();

        const ordersList = await OrderModel.find();

        let totalSales = 0;
        let monthlySales = [
            {
                name: 'JAN',
                TotalSales: 0
            },
            {
                name: 'FEB',
                TotalSales: 0
            },
            {
                name: 'MAR',
                TotalSales: 0
            },
            {
                name: 'APRIL',
                TotalSales: 0
            },
            {
                name: 'MAY',
                TotalSales: 0
            },
            {
                name: 'JUNE',
                TotalSales: 0
            },
            {
                name: 'JULY',
                TotalSales: 0
            },
            {
                name: 'AUG',
                TotalSales: 0
            },
            {
                name: 'SEP',
                TotalSales: 0
            },
            {
                name: 'OCT',
                TotalSales: 0
            },
            {
                name: 'NOV',
                TotalSales: 0
            },
            {
                name: 'DEC',
                TotalSales: 0
            },
        ]


        for (let i = 0; i < ordersList.length; i++) {
            totalSales = totalSales + parseInt(ordersList[i].totalAmt);
            const str = JSON.stringify(ordersList[i]?.createdAt);
            const year = str.substr(1, 4);
            const monthStr = str.substr(6, 8);
            const month = parseInt(monthStr.substr(0, 2));

            if (currentYear == year) {

                if (month === 1) {
                    monthlySales[0] = {
                        name: 'JAN',
                        TotalSales: monthlySales[0].TotalSales = parseInt(monthlySales[0].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 2) {

                    monthlySales[1] = {
                        name: 'FEB',
                        TotalSales: monthlySales[1].TotalSales = parseInt(monthlySales[1].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 3) {
                    monthlySales[2] = {
                        name: 'MAR',
                        TotalSales: monthlySales[2].TotalSales = parseInt(monthlySales[2].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 4) {
                    monthlySales[3] = {
                        name: 'APRIL',
                        TotalSales: monthlySales[3].TotalSales = parseInt(monthlySales[3].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 5) {
                    monthlySales[4] = {
                        name: 'MAY',
                        TotalSales: monthlySales[4].TotalSales = parseInt(monthlySales[4].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 6) {
                    monthlySales[5] = {
                        name: 'JUNE',
                        TotalSales: monthlySales[5].TotalSales = parseInt(monthlySales[5].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 7) {
                    monthlySales[6] = {
                        name: 'JULY',
                        TotalSales: monthlySales[6].TotalSales = parseInt(monthlySales[6].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 8) {
                    monthlySales[7] = {
                        name: 'AUG',
                        TotalSales: monthlySales[7].TotalSales = parseInt(monthlySales[7].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 9) {
                    monthlySales[8] = {
                        name: 'SEP',
                        TotalSales: monthlySales[8].TotalSales = parseInt(monthlySales[8].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 10) {
                    monthlySales[9] = {
                        name: 'OCT',
                        TotalSales: monthlySales[9].TotalSales = parseInt(monthlySales[9].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 11) {
                    monthlySales[10] = {
                        name: 'NOV',
                        TotalSales: monthlySales[10].TotalSales = parseInt(monthlySales[10].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 12) {
                    monthlySales[11] = {
                        name: 'DEC',
                        TotalSales: monthlySales[11].TotalSales = parseInt(monthlySales[11].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

            }


        }


        return response.status(200).json({
            totalSales: totalSales,
            monthlySales: monthlySales,
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}





export const totalUsersController = async (request, response) => {
    try {
        const users = await UserModel.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 },
            },
        ]);



        let monthlyUsers = [
            {
                name: 'JAN',
                TotalUsers: 0
            },
            {
                name: 'FEB',
                TotalUsers: 0
            },
            {
                name: 'MAR',
                TotalUsers: 0
            },
            {
                name: 'APRIL',
                TotalUsers: 0
            },
            {
                name: 'MAY',
                TotalUsers: 0
            },
            {
                name: 'JUNE',
                TotalUsers: 0
            },
            {
                name: 'JULY',
                TotalUsers: 0
            },
            {
                name: 'AUG',
                TotalUsers: 0
            },
            {
                name: 'SEP',
                TotalUsers: 0
            },
            {
                name: 'OCT',
                TotalUsers: 0
            },
            {
                name: 'NOV',
                TotalUsers: 0
            },
            {
                name: 'DEC',
                TotalUsers: 0
            },
        ]




        for (let i = 0; i < users.length; i++) {

            if (users[i]?._id?.month === 1) {
                monthlyUsers[0] = {
                    name: 'JAN',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 2) {
                monthlyUsers[1] = {
                    name: 'FEB',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 3) {
                monthlyUsers[2] = {
                    name: 'MAR',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 4) {
                monthlyUsers[3] = {
                    name: 'APRIL',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 5) {
                monthlyUsers[4] = {
                    name: 'MAY',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 6) {
                monthlyUsers[5] = {
                    name: 'JUNE',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 7) {
                monthlyUsers[6] = {
                    name: 'JULY',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 8) {
                monthlyUsers[7] = {
                    name: 'AUG',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 9) {
                monthlyUsers[8] = {
                    name: 'SEP',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 10) {
                monthlyUsers[9] = {
                    name: 'OCT',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 11) {
                monthlyUsers[10] = {
                    name: 'NOV',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 12) {
                monthlyUsers[11] = {
                    name: 'DEC',
                    TotalUsers: users[i].count
                }
            }

        }



        return response.status(200).json({
            TotalUsers: monthlyUsers,
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function deleteOrder(request, response) {
    try {
        const order = await OrderModel.findById(request.params.id);
        if (!order) {
            return response.status(404).json({
                message: "Order Not found",
                error: true,
                success: false
            })
        }


        const deletedOrder = await OrderModel.findByIdAndDelete(request.params.id);

        if (!deletedOrder) {
            return response.status(404).json({
                message: "Order not deleted!",
                success: false,
                error: true
            });
        }

        return response.status(200).json({
            success: true,
            error: false,
            message: "Order Deleted!",
        });
    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

export async function getRetailerOrdersController(request, response) {
    try {
        const retailerId = request.userId; 
        const retailer = await UserModel.findById(retailerId);
        if (!retailer) {
            return response.status(403).json({ message: "Access denied", error: true, success: false });
        }

        const { page = 1, limit = 10 } = request.query;

        const cacheKey = `retailer_orders_${retailerId}_${page}_${limit}`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return response.json(cachedData);
        }

        const orders = await OrderModel.find({ retailerId })
            .sort({ createdAt: -1 })
            .populate('delivery_address userId')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await OrderModel.countDocuments({ retailerId });
        const responseData = {
            message: "Retailer orders",
            data: orders,
            error: false,
            success: true,
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        };

        await setCache(cacheKey, responseData);
        return response.json(responseData);
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

