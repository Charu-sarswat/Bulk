const mongoose = require('mongoose');

const subscriptionUsageSchema = new mongoose.Schema({
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerSubscription', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  type: { type: String, enum: ['CREDIT', 'DEBIT'], default: 'DEBIT' },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  description: { type: String, default: '' }
}, { timestamps: true });

subscriptionUsageSchema.index({ subscriptionId: 1, createdAt: -1 });
subscriptionUsageSchema.index({ customerId: 1, createdAt: -1 });
subscriptionUsageSchema.index({ restaurantId: 1, createdAt: -1 });

module.exports = mongoose.models.SubscriptionUsage || mongoose.model('SubscriptionUsage', subscriptionUsageSchema);

