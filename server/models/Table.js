const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  table_number: { type: String, required: true, trim: true },
  capacity: { type: Number, default: 4, min: 1 },
  status: { type: String, enum: ['vacant', 'occupied'], default: 'vacant' },
  qr_code_url: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});

tableSchema.index({ restaurantId: 1, table_number: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
