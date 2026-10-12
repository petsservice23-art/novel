const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  coins_awarded: { type: Number, required: true },
  type: { type: String, enum: ['coins', 'subscription'], required: true },
  payment_provider: { type: String, enum: ['stripe', 'razorpay', 'paypal'], required: true },
  currency: { type: String, enum: ['USD', 'INR', 'EUR'], required: true },
  status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' },
  payment_id: { type: String } // Stripe PaymentIntent ID or Razorpay Order ID
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
