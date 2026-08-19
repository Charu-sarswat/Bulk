const mongoose = require('mongoose');

const cateringEnquirySchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  event_date: { type: String, required: true },
  guest_count: { type: Number, required: true, min: 1 },
  message: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'contacted', 'confirmed', 'cancelled'], default: 'pending' },
  created_at: { type: Date, default: Date.now }
});

cateringEnquirySchema.index({ restaurantId: 1, created_at: -1 });

module.exports = mongoose.model('CateringEnquiry', cateringEnquirySchema);
