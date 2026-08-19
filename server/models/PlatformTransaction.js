const mongoose = require('mongoose');

const platformTransactionSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', default: null },
  orderAmount: { type: Number, required: true },
  commissionPercentage: { type: Number, required: true },
  commissionAmount: { type: Number, required: true },
  restaurantAmount: { type: Number, required: true },
  paymentId: { type: String, default: '' },
  settlementStatus: { type: String, enum: ['pending', 'settled'], default: 'pending' },
  status: { type: String, default: 'completed' }
}, { timestamps: true });

module.exports = mongoose.model('PlatformTransaction', platformTransactionSchema);
