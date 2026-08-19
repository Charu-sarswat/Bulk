const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  sort_order: { type: Number, default: 0 },
  image_url: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});

categorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
