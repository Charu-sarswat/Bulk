const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  name: { type: String, required: true, trim: true, set: v => typeof v === 'string' ? v.toUpperCase() : v },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  delivery_price: { type: Number, default: 0 },
  image_url: { type: String, default: '' },
  image_urls: [{ type: String }],
  is_veg: { type: Boolean, default: true },
  is_featured: { type: Boolean, default: false },
  is_available: { type: Boolean, default: true },
  is_unlimited_stock: { type: Boolean, default: false },
  stock_quantity: { type: Number, default: 50, min: 0 },
  min_stock_level: { type: Number, default: 10, min: 0 },
  daily_prepared_quantity: { type: Number, default: 25, min: 0 },
  unit: { type: String, default: 'servings' },
  auto_out_of_stock: { type: Boolean, default: true },
  variants: [{
    name: String,
    price: Number
  }],
  addons: [{
    name: String,
    price: Number
  }],
  is_combo: { type: Boolean, default: false },
  combo_items: [{ type: String }],
  category_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  recipe: [{
    raw_material_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RawMaterial' },
    quantity_required: { type: Number, required: true }
  }],
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
