const mongoose = require('mongoose');

const itemDiscountRuleSchema = new mongoose.Schema({
  menuItemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'MenuItem', 
    required: true,
    unique: true
  },
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant', 
    required: false,
    default: null
  },
  bulkMinQuantity: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  bulkDiscountPercentage: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 100 
  },
  subscriptionDiscountPercentage: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 100 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  }
}, { timestamps: true });

itemDiscountRuleSchema.index({ restaurantId: 1, isActive: 1 });

module.exports = mongoose.model('ItemDiscountRule', itemDiscountRuleSchema);
