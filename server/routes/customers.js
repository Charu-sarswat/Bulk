const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

// @route   GET /api/customers
// @desc    Get all aggregated customer directory records (Registered + Guests) for current restaurant
// @access  Private (Admin / Staff)
router.get('/', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const registeredCustomers = await Customer.find({ restaurantId: req.restaurantId }).lean();
    const orders = await Order.find({ restaurantId: req.restaurantId }).lean();

    // Map by phone to aggregate metrics
    const customerMap = new Map();

    // 1. Initialize registered customers in map
    for (const cust of registeredCustomers) {
      if (cust.phone) {
        customerMap.set(cust.phone, {
          id: cust._id,
          name: cust.name || 'Registered Customer',
          phone: cust.phone,
          email: cust.email || '',
          is_registered: true,
          first_visit: cust.created_at || new Date(),
          last_visit: cust.created_at || new Date(),
          total_orders: 0,
          total_spent: 0
        });
      }
    }

    // 2. Aggregate orders data into customerMap
    for (const order of orders) {
      if (!order.customer_phone) continue;
      const phone = order.customer_phone.trim();
      if (!phone) continue;

      let record = customerMap.get(phone);
      if (!record) {
        // Guest customer record
        record = {
          id: null,
          name: order.customer_name || 'Guest Customer',
          phone: phone,
          email: '',
          is_registered: false,
          first_visit: order.created_at,
          last_visit: order.created_at,
          total_orders: 0,
          total_spent: 0
        };
        customerMap.set(phone, record);
      }

      record.total_orders += 1;
      record.total_spent += parseFloat(order.total_amount || 0);

      // Update visit dates
      const orderDate = new Date(order.created_at);
      if (!record.first_visit || orderDate < new Date(record.first_visit)) {
        record.first_visit = orderDate;
      }
      if (!record.last_visit || orderDate > new Date(record.last_visit)) {
        record.last_visit = orderDate;
      }

      // Keep latest non-generic name if guest
      if (!record.is_registered && order.customer_name && order.customer_name !== 'Guest Customer') {
        record.name = order.customer_name;
      }
    }

    const customersList = Array.from(customerMap.values()).sort((a, b) => new Date(b.last_visit) - new Date(a.last_visit));
    res.json(customersList);
  } catch (err) {
    console.error('Error fetching customers directory:', err);
    res.status(500).json({ message: 'Server error fetching customer directory.' });
  }
});

// @route   GET /api/customers/:id/orders
// @desc    Get order history for a specific customer by ID or Phone
// @access  Private (Admin / Staff)
router.get('/:id/orders', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const { id } = req.params;
    const orderFilter = { restaurantId: req.restaurantId };

    if (mongoose.Types.ObjectId.isValid(id)) {
      const customer = await Customer.findOne({ _id: id, restaurantId: req.restaurantId });
      if (customer) {
        orderFilter.$or = [{ customer_id: id }, { customer_phone: customer.phone }];
      } else {
        orderFilter.customer_id = id;
      }
    } else {
      orderFilter.customer_phone = id;
    }

    const orders = await Order.find(orderFilter).sort({ created_at: -1 }).lean();
    res.json(orders);
  } catch (err) {
    console.error('Error fetching customer orders:', err);
    res.status(500).json({ message: 'Server error fetching customer orders.' });
  }
});

module.exports = router;
