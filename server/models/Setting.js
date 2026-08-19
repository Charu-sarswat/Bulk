const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  key: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

settingSchema.index({ restaurantId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Setting', settingSchema);
