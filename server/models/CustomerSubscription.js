const mongoose = require('mongoose');

const customerSubscriptionSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  
  // Platform-wide Prepaid Rupee Balances
  initialBalance: { type: Number, required: true, min: 0 }, // E.g. ₹5000
  remainingBalance: { type: Number, required: true, min: 0 }, // E.g. ₹4000
  
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'REJECTED', 'CANCELLED'], 
    default: 'ACTIVE' 
  },
  
  // Super Admin UPI payment verification
  paymentReference: { type: String, default: '' }, // UTR / Tx ID
  paymentProofImage: { type: String, default: '' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date }
}, { timestamps: true });

customerSubscriptionSchema.index({ customerId: 1, status: 1 });

module.exports = mongoose.model('CustomerSubscription', customerSubscriptionSchema);

