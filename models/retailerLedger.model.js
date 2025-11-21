import mongoose from 'mongoose';

const retailerLedgerSchema = new mongoose.Schema({
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Retailer', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  settlementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Settlement' },
  type: { type: String, enum: ['CREDIT_PENDING', 'DEBIT_PAYOUT'], required: true },
  amount: Number,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('RetailerLedger', retailerLedgerSchema);
