const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

// @route   POST /api/auth/customer/register
// @desc    Register a new customer (phone is compulsory)
router.post('/register', async (req, res) => {
  const { name, phone, email, password } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ message: 'Name, phone number, and password are required' });
  }

  // Validate phone format
  const cleanPhone = phone.trim();
  if (cleanPhone.length < 10) {
    return res.status(400).json({ message: 'Please enter a valid 10-digit phone number' });
  }

  try {
    const existing = await Customer.findOne({ phone: cleanPhone });
    if (existing) {
      return res.status(400).json({ message: 'A customer account with this phone number already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const customer = new Customer({
      name: name.trim(),
      phone: cleanPhone,
      email: email ? email.trim() : '',
      password_hash
    });

    await customer.save();

    const payload = { customer: { id: customer._id, name: customer.name, phone: customer.phone } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_for_development', { expiresIn: '30d' });

    res.status(201).json({
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email
      }
    });
  } catch (err) {
    console.error('Customer register error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/auth/customer/login
// @desc    Customer login via phone & password
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Phone number and password are required' });
  }

  try {
    const customer = await Customer.findOne({ phone: phone.trim() });
    if (!customer) {
      return res.status(400).json({ message: 'No customer found with this phone number' });
    }

    const isMatch = await bcrypt.compare(password, customer.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { customer: { id: customer._id, name: customer.name, phone: customer.phone } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_for_development', { expiresIn: '30d' });

    res.json({
      token,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email
      }
    });
  } catch (err) {
    console.error('Customer login error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Helper middleware to verify customer token
const customerAuthMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token, access denied' });
  }
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Token format is invalid' });
  }
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_development');
    req.customer = decoded.customer;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid or has expired' });
  }
};

// @route   GET /api/auth/customer/me
// @desc    Get current customer details
router.get('/me', customerAuthMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id).select('-password_hash');
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({
      id: customer._id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      created_at: customer.created_at
    });
  } catch (err) {
    console.error('Get customer profile error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/auth/customer/orders
// @desc    Get order history for current customer using customer phone matching
router.get('/orders', customerAuthMiddleware, async (req, res) => {
  try {
    const Order = require('../models/Order');
    // Fetch orders placed by this customer's phone
    const orders = await Order.find({ customer_phone: req.customer.phone }).sort({ created_at: -1 });
    
    const formatted = orders.map(o => ({
      id: o._id,
      order_number: o.order_number,
      table_id: o.table_id,
      table_number: o.table_snapshot || 'Takeaway',
      customer_id: o.customer_id,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      order_channel: o.order_channel,
      scheduled_time: o.scheduled_time,
      status: o.status,
      payment_status: o.payment_status,
      payment_method: o.payment_method,
      total_amount: o.total_amount,
      notes: o.notes,
      items: o.items,
      created_at: o.created_at
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Get customer orders error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/auth/customer/all
// @desc    Get all registered customers (Admin/Staff)
router.get('/all', async (req, res) => {
  try {
    const customers = await Customer.find().select('-password_hash').sort({ created_at: -1 });
    res.json(customers);
  } catch (err) {
    console.error('Get customers error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
