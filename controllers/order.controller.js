import OrderModel from "../models/order.model.js";
import { validateAddress, createShipment } from '../utils/shiprocket.service.js';
import UserModel from '../models/user.model.js';
import OrderConfirmationEmail from "../utils/orderEmailTemplate.js";
import sendEmailFun from "../config/sendEmail.js";
import dotenv from 'dotenv';
import { getCache, setCache, delCache } from '../utils/redisUtil.js';
dotenv.config();

export const createOrderController = async (request, response) => {
    try {

        // Validate user's delivery address with Shiprocket
        const deliveryPincode = request.body.delivery_address?.pincode;
        if (!deliveryPincode) {
            return response.status(400).json({ error: true, success: false, message: 'Delivery pincode required.' });
        }
        const isServiceable = await validateAddress(deliveryPincode);
        if (!isServiceable) {
            return response.status(400).json({ error: true, success: false, message: 'Delivery address not serviceable by Shiprocket. Please update your address.' });
        }

        console.log("request.body.products ",request.body.products);

        let order = new OrderModel({
            userId: request.body.userId,
            products: request.body.products,
            paymentId: request.body.paymentId,
            payment_status: request.body.payment_status,
            delivery_address: request.body.delivery_address,
            totalAmt: request.body.totalAmt,
            date: request.body.date,
            order_status: 'pending' // Save as pending until retailer approval
        });

        if (!order) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

    order = await order.save();
        // Invalidate order-related cache after creating an order
        await delCache('order_list');
        await delCache(`user_order_list_${request.body.userId}`);
        await delCache('total_orders_count');
        const user = await UserModel.findOne({ _id: request.body.userId })

        const recipients = [];
        recipients.push(user?.email);

        // Send verification email
        await sendEmailFun({
            sendTo: recipients,
            subject: "Order Confirmation",
            text: "",
            html: OrderConfirmationEmail(user?.name, order)
        })


        return response.status(200).json({
            error: false,
            success: true,
            message: "Order Placed. Awaiting retailer approval.",
            order: order
        });


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


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