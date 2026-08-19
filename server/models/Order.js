const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menu_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', default: null },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, default: 0 },
  discount_percentage: { type: Number, default: 0 },
  discount_type: { type: String, enum: ['NONE', 'BULK', 'SUBSCRIPTION'], default: 'NONE' },
  discount_amount: { type: Number, default: 0 },
  final_price: { type: Number, default: 0 },
  notes: { type: String, default: '' }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  order_number: { type: String, required: true },
  table_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
  table_snapshot: { type: String, default: 'Takeaway' },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  customer_name: { type: String, default: 'Guest Customer' },
  customer_phone: { 
    type: String, 
    required: function() { 
      return !(this.admin_created && this.order_channel === 'dine_in');
    }, 
    trim: true 
  },
  admin_created: { type: Boolean, default: false },
  order_channel: { 
    type: String, 
    enum: ['dine_in', 'takeaway', 'delivery'], 
    default: 'dine_in' 
  },
  delivery_address: { type: String, default: '' },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  delivery_job_id: { type: String, default: '' },
  delivery_rider_name: { type: String, default: '' },
  delivery_rider_phone: { type: String, default: '' },
  delivery_status: { type: String, default: '' }, // 'assigning', 'rider_assigned', 'at_store', 'out_for_delivery', 'delivered'
  delivery_otp: { type: String, default: '' },
  delivery_tracking_url: { type: String, default: '' },
  scheduled_time: { type: Date, default: null },
  status: { 
    type: String, 
    enum: ['received', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'served', 'cancelled', 'hold'], 
    default: 'received' 
  },
  payment_status: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  payment_method: { 
    type: String, 
    enum: ['counter', 'online', 'upi', 'card', 'cod', 'subscription', 'mixed', 'wallet'], 
    default: 'upi' 
  },
  payment_utr: { type: String, default: '' },
  is_refunded: { type: Boolean, default: false },
  refund_status: { type: String, enum: ['NONE', 'PARTIAL', 'FULL'], default: 'NONE' },
  refund_details: { type: Object, default: {} },
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  discount_amount: { type: Number, default: 0 },
  finalAmount: { type: Number, default: 0 },
  total_amount: { type: Number, required: true, min: 0 },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerSubscription', default: null },
  subscriptionAmount: { type: Number, default: 0 },
  normalPaymentAmount: { type: Number, default: 0 },
  walletAmount: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  items: [orderItemSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

orderSchema.index({ restaurantId: 1, order_number: 1 }, { unique: true });
orderSchema.index({ restaurantId: 1, created_at: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });

orderSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
