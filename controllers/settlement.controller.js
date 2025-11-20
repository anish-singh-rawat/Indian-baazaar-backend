import Order from '../models/order.model.js';
import Settlement from '../models/settlement.model.js';
import RetailerWallet from '../models/retailerWallet.model.js';
import RetailerLedger from '../models/retailerLedger.model.js';
import Razorpay from 'razorpay';
import dotenv from 'dotenv'
import UserModel from '../models/user.model.js';
dotenv.config()

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const approveSettlement = async (req, res) => {
  const { orderId } = req.params;
  const adminId = req.user._id; 
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ error: true, message: 'Order not found' });

  if (order.paymentStatus !== 'SUCCESS') return res.status(400).json({ error: true, message: 'Payment not successful' });
  if (order.shippingStatus !== 'DELIVERED') return res.status(400).json({ error: true, message: 'Order not delivered' });

  if (!order.deliveredAt || (Date.now() - new Date(order.deliveredAt).getTime()) < 7 * 24 * 60 * 60 * 1000)
  return res.status(400).json({ error: true, message: '7 days not completed since delivery' });

  if (order.settlementStatus === 'PAID') return res.status(400).json({ error: true, message: 'Already settled' });

  let settlement = await Settlement.findOne({ orderId: order._id });
  if (settlement && settlement.status === 'PAID') return res.status(400).json({ error: true, message: 'Already settled' });
  
  const netPayableToRetailer = order.totalAmt - (order.platformCommission * 100);

  const retailer = await UserModel.findById(order.retailerId);
  if (!retailer || !retailer.razorpayFundAccountId)
    return res.status(400).json({ error: true, message: 'Retailer Razorpay account not found' });

  if (!settlement) {
    settlement = await Settlement.create({
      retailerId: order.retailerId,
      orderId: order._id,
      amount: netPayableToRetailer,
      status: 'PENDING',
      approvedBy: adminId,
      approvedAt: new Date()
    });
  } else {
    settlement.status = 'PENDING';
    settlement.approvedBy = adminId;
    settlement.approvedAt = new Date();
    await settlement.save();
  }

  try {
    const payout = await razorpay.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      fund_account_id: retailer.razorpayFundAccountId,
      amount: Math.round(netPayableToRetailer * 100),
      currency: 'INR',
      mode: 'IMPS',
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: settlement._id.toString(),
      narration: `Order ${order.orderId} settlement`
    });

    settlement.status = 'PAID';
    settlement.razorpayTransferId = payout.id;
    await settlement.save();

    order.settlementStatus = 'PAID';
    await order.save();

    await RetailerWallet.findOneAndUpdate(
      { retailerId: order.retailerId },
      {
        $inc: {
          pendingBalance: -netPayableToRetailer,
          totalSettled: netPayableToRetailer
        }
      }
    );

    await RetailerLedger.create({
      retailerId: order.retailerId,
      orderId: order._id,
      settlementId: settlement._id,
      type: 'DEBIT_PAYOUT',
      amount: netPayableToRetailer,
      description: 'Payout to retailer'
    });

    return res.json({ success: true, message: 'Settlement approved and paid successfully', payoutId: payout.id });
  } catch (err) {
    settlement.status = 'FAILED';
    await settlement.save();
    return res.status(500).json({ error: true, message: 'Payout failed', details: err.message });
  }
};
