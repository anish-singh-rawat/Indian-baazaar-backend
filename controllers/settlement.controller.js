import Order from "../models/order.model.js";
import Settlement from "../models/settlement.model.js";
import RetailerWallet from "../models/retailerWallet.model.js";
import RetailerLedger from "../models/retailerLedger.model.js";
import RetailerBankDetails from "../models/retailerBankDetails.model.js";
import Razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const approveSettlement = async (req, res) => {
  try {
    const { orderId } = req.params;
    const adminId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({ error: true, message: "Order not found" });

    if (order.shippingStatus !== "DELIVERED")
      return res
        .status(400)
        .json({ error: true, message: "Order not delivered" });
    if (
      !order.deliveredAt ||
      Date.now() - new Date(order.deliveredAt).getTime() <
        7 * 24 * 60 * 60 * 1000
    )
      return res
        .status(400)
        .json({ error: true, message: "7 days not completed since delivery" });

    const retailerId = order.retailerId;
    if (!retailerId)
      return res
        .status(400)
        .json({ error: true, message: "Retailer not linked to order" });

    const bankDetails = await RetailerBankDetails.findOne({ retailerId });
    if (!bankDetails)
      return res
        .status(400)
        .json({
          error: true,
          message:
            "Retailer bank details not found. Please update bank details before settlement.",
        });

    const payableAmount = order.totalAmt - order.totalAmt * 0.02;

    try {
      const fundAccountResult = await razorpay.fundAccount.create({
        account_type: "bank_account",
        bank_account: {
          name: bankDetails.accountHolderName,
          account_number: bankDetails.accountNumber,
          ifsc: bankDetails.ifscCode,
        },
      });
      bankDetails.razorpayFundAccountId = fundAccountResult.id;
      await bankDetails.save();
    } catch (error) {
      return res
        .status(500)
        .json({
          error: true,
          message: "Failed to create fund account",
          details: error.message,
        });
    }

    const settlement = await Settlement.create({
      retailerId,
      orderId: order._id,
      payoutId: fundAccountResult.id,
      amount: payableAmount,
      status: "PAID",
      approvedBy: adminId,
      approvedAt: new Date(),
      razorpayTransferId: fundAccountResult.id,
    });

    order.paymentApprovalByAdmin = true;
    order.paymentApprovalAt = new Date();
    order.paymentReleased = true;
    order.paymentReleasedAt = new Date();
    order.settlementStatus = "PAID";
    await order.save();

    await RetailerWallet.findOneAndUpdate(
      { retailerId },
      { $inc: { pendingBalance: -payableAmount, totalSettled: payableAmount } },
      { upsert: true }
    );

    await RetailerLedger.create({
      retailerId,
      orderId: order._id,
      settlementId: settlement._id,
      type: "DEBIT_PAYOUT",
      amount: payableAmount,
      description: "Payout to retailer bank account",
    });

    return res.json({
      success: true,
      message: "Settlement approved and payout sent successfully",
      data: {
        payoutId: payout.id,
        amount: payableAmount,
        settlementId: settlement._id,
      },
    });
  } catch (error) {
    console.log("Error : ", error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
