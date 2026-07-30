const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff', 'kitchen'], default: 'staff' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
