const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menu_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', default: null },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  notes: { type: String, default: '' }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  order_number: { type: String, required: true, unique: true },
  table_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
  table_snapshot: { type: String, default: 'Takeaway' },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  customer_name: { type: String, default: 'Guest Customer' },
  customer_phone: { type: String, required: true, trim: true },
  order_channel: { 
    type: String, 
    enum: ['dine_in', 'takeaway', 'delivery'], 
    default: 'dine_in' 
  },
  delivery_address: { type: String, default: '' },
  delivery_job_id: { type: String, default: '' },
  delivery_rider_name: { type: String, default: '' },
  delivery_rider_phone: { type: String, default: '' },
  delivery_status: { type: String, default: '' }, // 'assigning', 'rider_assigned', 'at_store', 'out_for_delivery', 'delivered'
  scheduled_time: { type: Date, default: null },
  status: { 
    type: String, 
    enum: ['received', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'served', 'cancelled', 'hold'], 
    default: 'received' 
  },
  payment_status: { 
    type: String, 
    enum: ['pending', 'paid', 'failed'], 
    default: 'pending' 
  },
  payment_method: { 
    type: String, 
    enum: ['counter', 'online', 'upi', 'card', 'cod'], 
    default: 'upi' 
  },
  payment_utr: { type: String, default: '' },
  total_amount: { type: Number, required: true, min: 0 },
  notes: { type: String, default: '' },
  items: [orderItemSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

orderSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
