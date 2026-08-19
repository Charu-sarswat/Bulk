const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  type: { type: String, enum: ['CREDIT', 'DEBIT', 'REFUND'], required: true },
  amount: { type: Number, required: true, min: 0 },
  balanceBefore: { type: Number, required: true, min: 0 },
  balanceAfter: { type: Number, required: true, min: 0 },
  referenceType: { type: String, enum: ['WALLET_TOPUP', 'MESS_SUBSCRIPTION', 'SUBSCRIPTION_RENEWAL', 'SUBSCRIPTION_REFUND', 'FOOD_ORDER', 'ORDER_PAYMENT', 'OTHER'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  description: { type: String, default: '' },
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'SUCCESS' }
}, { timestamps: true });

walletTransactionSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
