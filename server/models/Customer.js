const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  // restaurantId is optional — customers are global platform accounts
  // (they can subscribe to multiple messes using the same account)
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true, unique: true },
  email: { type: String, trim: true, default: '' },
  password_hash: { type: String, default: '' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', customerSchema);
