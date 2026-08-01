const express = require('express');
const router = express.Router();
const RawMaterial = require('../models/RawMaterial');
const InventoryLog = require('../models/InventoryLog');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

// @route   GET /api/inventory/raw
// @desc    Get all raw materials
router.get('/', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const materials = await RawMaterial.find().sort({ name: 1 });
    res.json(materials);
  } catch (err) {
    console.error('Get raw materials error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/inventory/raw
// @desc    Create new raw material
router.post('/', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  const { name, stock_quantity, unit, min_stock_level } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    const existing = await RawMaterial.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Raw material with this name already exists' });
    }

    const material = new RawMaterial({
      name: name.trim(),
      stock_quantity: stock_quantity !== undefined ? Number(stock_quantity) : 0,
      unit: unit || 'units',
      min_stock_level: min_stock_level !== undefined ? Number(min_stock_level) : 10
    });

    await material.save();

    // Log the initial creation stock
    if (material.stock_quantity > 0) {
      const log = new InventoryLog({
        raw_material_id: material._id,
        change_type: 'STOCK_SET',
        quantity_change: material.stock_quantity,
        previous_stock: 0,
        new_stock: material.stock_quantity,
        reason: 'Initial stock set on creation',
        recorded_by: req.user ? req.user.username : 'Admin'
      });
      await log.save();
    }

    res.status(201).json(material);
  } catch (err) {
    console.error('Create raw material error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/inventory/raw/:id
// @desc    Update raw material details / adjust stock
router.put('/:id', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  const { name, unit, min_stock_level, change_type, quantity, reason } = req.body;

  try {
    const material = await RawMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ message: 'Raw material not found' });
    }

    const prevStock = material.stock_quantity;
    let newStock = prevStock;

    if (change_type) {
      const qtyNum = Number(quantity);
      if (isNaN(qtyNum)) {
        return res.status(400).json({ message: 'Invalid quantity provided' });
      }

      if (change_type === 'STOCK_ADD' || change_type === 'RESTOCK') {
        newStock += qtyNum;
      } else if (change_type === 'STOCK_SUB' || change_type === 'WASTAGE') {
        newStock = Math.max(0, prevStock - qtyNum);
      } else if (change_type === 'STOCK_SET') {
        newStock = Math.max(0, qtyNum);
      }

      material.stock_quantity = newStock;
    }

    if (name !== undefined) material.name = name.trim();
    if (unit !== undefined) material.unit = unit;
    if (min_stock_level !== undefined) material.min_stock_level = Number(min_stock_level);

    await material.save();

    // Log the stock update if any change occurred
    if (change_type) {
      const log = new InventoryLog({
        raw_material_id: material._id,
        change_type: change_type || 'STOCK_SET',
        quantity_change: Number(quantity),
        previous_stock: prevStock,
        new_stock: newStock,
        reason: reason || 'Manual adjustment via raw materials inventory',
        recorded_by: req.user ? req.user.username : 'Admin'
      });
      await log.save();
    }

    res.json({ message: 'Raw material updated successfully', material });
  } catch (err) {
    console.error('Update raw material error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/inventory/raw/:id
// @desc    Delete raw material
router.delete('/:id', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const deleted = await RawMaterial.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Raw material not found' });
    }
    res.json({ message: 'Raw material deleted successfully' });
  } catch (err) {
    console.error('Delete raw material error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/inventory/raw/:id/logs
// @desc    Get audit trail history for specific raw material
router.get('/:id/logs', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const logs = await InventoryLog.find({ raw_material_id: req.params.id }).sort({ created_at: -1 }).limit(50);
    const formatted = logs.map(l => ({
      id: l._id,
      change_type: l.change_type,
      quantity_change: l.quantity_change,
      previous_stock: l.previous_stock,
      new_stock: l.new_stock,
      reason: l.reason,
      recorded_by: l.recorded_by,
      created_at: l.created_at
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Get raw material logs error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
