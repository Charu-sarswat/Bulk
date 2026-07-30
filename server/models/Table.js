const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  table_number: { type: String, required: true, unique: true, trim: true },
  capacity: { type: Number, default: 4, min: 1 },
  status: { type: String, enum: ['vacant', 'occupied'], default: 'vacant' },
  qr_code_url: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Table', tableSchema);
