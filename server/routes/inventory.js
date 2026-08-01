const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const InventoryLog = require('../models/InventoryLog');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

// @route   GET /api/inventory/items
// @desc    Get inventory items with stock levels
router.get('/items', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const items = await MenuItem.find().populate('category_id', 'name').sort({ name: 1 });
    const formatted = items.map(i => ({
      id: i._id,
      name: i.name,
      category_name: i.category_id ? i.category_id.name : 'Unassigned',
      stock_quantity: i.stock_quantity,
      min_stock_level: i.min_stock_level,
      daily_prepared_quantity: i.daily_prepared_quantity,
      unit: i.unit,
      is_available: i.is_available,
      auto_out_of_stock: i.auto_out_of_stock
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Get inventory error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/inventory/update
// @desc    Update stock quantity & log audit trail
router.post('/update', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  const { menu_item_id, change_type, quantity_change, reason } = req.body;

  if (!menu_item_id || !change_type || quantity_change === undefined) {
    return res.status(400).json({ message: 'Item ID, change type, and quantity change are required' });
  }

  try {
    const item = await MenuItem.findById(menu_item_id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    const prevStock = item.stock_quantity;
    let newStock = prevStock;

    if (change_type === 'STOCK_ADD' || change_type === 'RESTOCK' || change_type === 'DAILY_PREPARED') {
      newStock += Number(quantity_change);
    } else if (change_type === 'ORDER_DEDUCT' || change_type === 'WASTAGE') {
      newStock = Math.max(0, prevStock - Number(quantity_change));
    } else if (change_type === 'STOCK_SET') {
      newStock = Math.max(0, Number(quantity_change));
    }

    item.stock_quantity = newStock;
    if (item.auto_out_of_stock) {
      item.is_available = newStock > 0;
    }
    await item.save();

    const log = new InventoryLog({
      menu_item_id,
      change_type,
      quantity_change: Number(quantity_change),
      previous_stock: prevStock,
      new_stock: newStock,
      reason: reason || '',
      recorded_by: req.user ? req.user.username : 'Admin'
    });
    await log.save();

    res.json({
      message: 'Stock updated successfully',
      item: { id: item._id, name: item.name, stock_quantity: item.stock_quantity, is_available: item.is_available },
      log
    });
  } catch (err) {
    console.error('Update inventory error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/inventory/logs
// @desc    Get audit trail logs
router.get('/logs', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const logs = await InventoryLog.find({ raw_material_id: { $ne: null } })
      .populate('raw_material_id', 'name')
      .sort({ created_at: -1 })
      .limit(100);
      
    const formatted = logs.map(l => ({
      id: l._id,
      item_name: l.raw_material_id ? l.raw_material_id.name : 'Deleted Item',
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
    console.error('Get logs error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/inventory
// @desc    Get complete inventory summary statistics and lists (Dashboard-style API wrapper)
router.get('/', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const items = await MenuItem.find().populate('category_id', 'name').sort({ name: 1 });
    const formattedItems = items.map(i => {
      let stockStatus = 'IN_STOCK';
      if (i.stock_quantity === 0) {
        stockStatus = 'OUT_OF_STOCK';
      } else if (i.stock_quantity <= i.min_stock_level) {
        stockStatus = 'LOW_STOCK';
      }

      return {
        id: i._id,
        name: i.name,
        category_name: i.category_id ? i.category_id.name : 'Unassigned',
        stock_quantity: i.stock_quantity,
        min_stock_level: i.min_stock_level,
        daily_prepared_quantity: i.daily_prepared_quantity,
        unit: i.unit,
        is_available: i.is_available,
        auto_out_of_stock: i.auto_out_of_stock,
        stock_status: stockStatus,
        price: i.price,
        is_veg: i.is_veg,
        image_url: i.image_url
      };
    });

    // Calculate metrics summary stats
    const totalItems = items.length;
    const lowStockCount = items.filter(i => i.stock_quantity <= i.min_stock_level).length;
    const outOfStockCount = items.filter(i => i.stock_quantity === 0).length;

    res.json({
      items: formattedItems,
      metrics: {
        totalItems,
        lowStockItems: lowStockCount,
        outOfStockItems: outOfStockCount
      }
    });
  } catch (err) {
    console.error('Get inventory summary statistics error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/inventory/items/:itemId/logs
// @desc    Get audit trail history for specific menu item
router.get('/items/:itemId/logs', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const logs = await InventoryLog.find({ menu_item_id: req.params.itemId }).sort({ created_at: -1 }).limit(50);
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
    console.error('Get item logs error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/inventory/:itemId/stock
// @desc    Adjust item stock settings or prep levels (from adjust modal)
router.put('/:itemId/stock', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  const { change_type, quantity, reason, min_stock_level } = req.body;
  try {
    const item = await MenuItem.findById(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const prevStock = item.stock_quantity;
    let newStock = prevStock;

    if (change_type === 'STOCK_ADD') {
      newStock += Number(quantity);
    } else if (change_type === 'STOCK_SUB') {
      newStock = Math.max(0, prevStock - Number(quantity));
    } else if (change_type === 'STOCK_SET') {
      newStock = Math.max(0, Number(quantity));
    }

    item.stock_quantity = newStock;
    if (min_stock_level !== undefined) {
      item.min_stock_level = Number(min_stock_level);
    }

    if (item.auto_out_of_stock) {
      item.is_available = newStock > 0;
    }
    await item.save();

    // Log this change
    const log = new InventoryLog({
      menu_item_id: item._id,
      change_type: change_type || 'STOCK_SET',
      quantity_change: Number(quantity),
      previous_stock: prevStock,
      new_stock: newStock,
      reason: reason || 'Manual adjustment via inventory manager screen',
      recorded_by: req.user ? req.user.username : 'Admin'
    });
    await log.save();

    res.json({ message: 'Stock adjusted successfully', item });
  } catch (err) {
    console.error('Adjust stock error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
