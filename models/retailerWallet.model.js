import mongoose from 'mongoose';

const retailerWalletSchema = new mongoose.Schema({
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Retailer', unique: true },
  pendingBalance: { type: Number, default: 0 },
  totalSettled: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('RetailerWallet', retailerWalletSchema);
