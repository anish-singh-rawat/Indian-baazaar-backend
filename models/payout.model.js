import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'order', required: true },
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  payoutId: { type: String, required: true }, // Razorpay payout ID
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Payout', payoutSchema);
