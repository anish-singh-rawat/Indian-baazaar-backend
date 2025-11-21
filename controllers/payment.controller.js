import crypto from "crypto";
import Order from "../models/order.model.js";
import RetailerWallet from "../models/retailerWallet.model.js";
import RetailerLedger from "../models/retailerLedger.model.js";
import dotenv from "dotenv";
dotenv.config();

export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    if (signature !== expectedSignature) {
      return res
        .status(400)
        .json({ error: true, message: "Invalid signature" });
    }

    const event = req.body.event;
    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      const order = await Order.findOne({ razorpayOrderId });
      if (!order)
        return res
          .status(404)
          .json({ error: true, message: "Order not found" });

      if (order.paymentStatus === "SUCCESS")
        return res.status(200).json({ success: true });

      order.paymentStatus = "SUCCESS";
      order.razorpayPaymentId = razorpayPaymentId;
      await order.save();

      await RetailerWallet.findOneAndUpdate(
        { retailerId: order.retailerId },
        { $inc: { pendingBalance: order.netPayableToRetailer } },
        { upsert: true, new: true }
      );

      await RetailerLedger.create({
        retailerId: order.retailerId,
        orderId: order._id,
        type: "CREDIT_PENDING",
        amount: order.netPayableToRetailer,
        description: "Payment captured, pending payout",
      });

      return res.status(200).json({ success: true });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.log("error : ", error);
    return res.status(500).json({ 
      error: true, 
      success: false,
      message: error.message || "Internal Server Error" 
    });
  }
};
