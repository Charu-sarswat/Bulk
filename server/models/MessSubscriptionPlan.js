const mongoose = require('mongoose');

const messSubscriptionPlanSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 }, // Represents the prepaid balance credited to the subscription
  durationDays: { type: Number, required: true, min: 1 },
  mealType: { type: String, default: 'PREPAID_WALLET' },
  mealLimit: { type: Number, default: null },
  mealsAllowed: [{ type: String, default: 'ALL_MEALS' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

messSubscriptionPlanSchema.index({ restaurantId: 1, isActive: 1 });

module.exports = mongoose.model('MessSubscriptionPlan', messSubscriptionPlanSchema);
