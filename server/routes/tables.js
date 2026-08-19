const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// @route   GET /api/tables
// @desc    Get all tables for current restaurant
router.get('/', async (req, res) => {
  try {
    if (!req.restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }
    const tables = await Table.find({ restaurantId: req.restaurantId }).sort({ table_number: 1 });
    const formatted = tables.map(t => ({
      id: t._id,
      table_number: t.table_number,
      capacity: t.capacity,
      status: t.status,
      qr_code_url: t.qr_code_url,
      restaurantId: t.restaurantId
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Get tables error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/tables/:id
// @desc    Get table by ID (Public bootstrapping)
router.get('/:id', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.json({
      id: table._id,
      table_number: table.table_number,
      capacity: table.capacity,
      status: table.status,
      qr_code_url: table.qr_code_url,
      restaurantId: table.restaurantId
    });
  } catch (err) {
    console.error('Get table by id error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/tables
// @desc    Create new table (Admin/Staff)
router.post('/', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const { table_number, capacity } = req.body;
    if (!table_number) return res.status(400).json({ message: 'Table number is required' });

    // Validate limit
    const currentTableCount = await Table.countDocuments({ restaurantId: req.restaurantId });
    const Subscription = require('../models/Subscription');
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    const sub = await Subscription.findOne({ restaurantId: req.restaurantId, status: 'active' });
    if (sub) {
      const plan = await SubscriptionPlan.findById(sub.planId);
      if (plan && plan.maxTables !== -1 && currentTableCount >= plan.maxTables) {
        return res.status(400).json({
          message: `Your current subscription allows a maximum of ${plan.maxTables} tables. Upgrade your plan to add more.`
        });
      }
    }

    // Check if table already exists in this restaurant
    const exists = await Table.findOne({ restaurantId: req.restaurantId, table_number: String(table_number) });
    if (exists) {
      return res.status(400).json({ message: `Table "${table_number}" already exists in this restaurant.` });
    }

    const newTable = new Table({
      restaurantId: req.restaurantId,
      table_number: String(table_number),
      capacity: capacity ? Number(capacity) : 4
    });

    // Generate dynamic QR Code URL using restaurant slug and table number
    const Restaurant = require('../models/Restaurant');
    const restaurantObj = await Restaurant.findById(req.restaurantId);
    const slug = restaurantObj ? restaurantObj.slug : 'default';

    const targetUrl = `${clientUrl}/order?restaurant=${slug}&table=${table_number}`;
    newTable.qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(targetUrl)}&margin=1`;

    await newTable.save();
    res.status(201).json({ id: newTable._id, ...newTable.toObject() });
  } catch (err) {
    console.error('Create table error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/tables/:id
// @desc    Delete a table
router.delete('/:id', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const table = await Table.findOneAndDelete({ _id: req.params.id, restaurantId: req.restaurantId });
    if (!table) {
      return res.status(404).json({ message: 'Table not found or unauthorized' });
    }
    res.json({ message: 'Table deleted successfully' });
  } catch (err) {
    console.error('Delete table error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
