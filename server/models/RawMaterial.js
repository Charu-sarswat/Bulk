const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  stock_quantity: { type: Number, default: 0, min: 0 },
  unit: { type: String, default: 'units' },
  min_stock_level: { type: Number, default: 10, min: 0 },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
