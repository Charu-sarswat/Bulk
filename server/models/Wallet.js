const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true },
  balance: { type: Number, required: true, default: 0, min: 0 },
  currency: { type: String, default: 'INR' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);
