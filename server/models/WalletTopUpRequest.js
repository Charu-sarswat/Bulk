const mongoose = require('mongoose');

const walletTopUpRequestSchema = new mongoose.Schema({
  customerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer',    required: true },
  restaurantId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant',  default: null },
  walletId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet',      required: true },
  amount:          { type: Number, required: true, min: 1 },

  // Snapshot of restaurant UPI at time of request
  upiId:           { type: String, default: '' },

  // Customer-provided payment proof
  utrNumber:       { type: String, required: true, trim: true },
  paymentDate:     { type: Date,   required: true },
  customerNote:    { type: String, default: '' },

  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'REJECTED'],
    default: 'PENDING'
  },

  // Set when admin confirms
  verifiedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verifiedAt:      { type: Date,   default: null },

  // Set when admin rejects
  rejectionReason: { type: String, default: '' },

  // Link to the WalletTransaction created on confirmation (for audit trail)
  walletTransactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTransaction', default: null }
}, { timestamps: true });

// Fast lookups
walletTopUpRequestSchema.index({ customerId: 1, createdAt: -1 });
walletTopUpRequestSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('WalletTopUpRequest', walletTopUpRequestSchema);
