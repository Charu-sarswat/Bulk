const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  status: { type: String, enum: ['active', 'expired', 'cancelled', 'suspended'], default: 'active' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  amount: { type: Number, required: true, min: 0 },
  commissionPercentage: { type: Number, default: 0 },
  autoRenew: { type: Boolean, default: true },
  paymentId: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
