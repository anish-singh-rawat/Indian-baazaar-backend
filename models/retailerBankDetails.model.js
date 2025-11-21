import mongoose from 'mongoose';

const retailerBankDetailsSchema = new mongoose.Schema({
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  accountHolderName: { type: String, required: true },
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true },
  branchName: { type: String },
  upiId: { type: String },
  razorpayFundAccountId: { type: String }, // To store Razorpay fund account ID
}, { timestamps: true });

export default mongoose.model('RetailerBankDetails', retailerBankDetailsSchema);
