const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  menu_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  change_type: { 
    type: String, 
    enum: ['STOCK_ADD', 'STOCK_SET', 'DAILY_PREPARED', 'ORDER_DEDUCT', 'RESTOCK', 'WASTAGE'],
    required: true 
  },
  quantity_change: { type: Number, required: true },
  previous_stock: { type: Number, required: true },
  new_stock: { type: Number, required: true },
  reason: { type: String, default: '' },
  recorded_by: { type: String, default: 'Admin' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
