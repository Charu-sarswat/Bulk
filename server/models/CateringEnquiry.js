const mongoose = require('mongoose');

const cateringEnquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  event_date: { type: String, required: true },
  guest_count: { type: Number, required: true, min: 1 },
  message: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'contacted', 'confirmed', 'cancelled'], default: 'pending' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CateringEnquiry', cateringEnquirySchema);
