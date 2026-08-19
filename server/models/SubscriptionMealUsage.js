const mongoose = require('mongoose');

const subscriptionMealUsageSchema = new mongoose.Schema({
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerSubscription', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  mealType: { type: String, required: true }, // e.g. BREAKFAST, LUNCH, DINNER
  quantity: { type: Number, default: 1 },
  usedAt: { type: Date, default: Date.now }
}, { timestamps: true });

subscriptionMealUsageSchema.index({ subscriptionId: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model('SubscriptionMealUsage', subscriptionMealUsageSchema);
