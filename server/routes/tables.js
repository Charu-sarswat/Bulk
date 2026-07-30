const express = require('express');
const router = express.Router();
const Table = require('../models/Table');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

// @route   GET /api/tables
// @desc    Get all tables
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find().sort({ table_number: 1 });
    const formatted = tables.map(t => ({
      id: t._id,
      table_number: t.table_number,
      capacity: t.capacity,
      status: t.status,
      qr_code_url: t.qr_code_url
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Get tables error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/tables/:id
// @desc    Get table by ID
router.get('/:id', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.json({
      id: table._id,
      table_number: table.table_number,
      capacity: table.capacity,
      status: table.status,
      qr_code_url: table.qr_code_url
    });
  } catch (err) {
    console.error('Get table by id error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/tables
// @desc    Create new table
router.post('/', auth, authorizeRoles('admin'), async (req, res) => {
  try {
    const { table_number, capacity } = req.body;
    if (!table_number) return res.status(400).json({ message: 'Table number is required' });

    const newTable = new Table({
      table_number: String(table_number),
      capacity: capacity ? Number(capacity) : 4
    });
    await newTable.save();
    res.status(201).json({ id: newTable._id, ...newTable.toObject() });
  } catch (err) {
    console.error('Create table error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
