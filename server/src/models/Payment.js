const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
  email: String,
  amount: Number,
  description: String,
  status: { type: String, enum: ['initiated', 'completed'], default: 'initiated' },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Payment', paymentSchema);