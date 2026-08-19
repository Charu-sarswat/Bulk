const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const ItemDiscountRule = require('../models/ItemDiscountRule');
const MenuItem = require('../models/MenuItem');
const CustomerSubscription = require('../models/CustomerSubscription');

// ─── PUBLIC / CUSTOMER ENDPOINTS ────────────────────────────────────────────

/**
 * GET /api/discounts/active?restaurantId=...
 * Returns all active discount rules for a given restaurant.
 */
router.get('/active', async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const filter = { isActive: true };
    if (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) {
      filter.restaurantId = restaurantId;
    }

    const rules = await ItemDiscountRule.find(filter)
      .populate('menuItemId', 'name price image_url is_veg')
      .lean();

    res.json(rules);
  } catch (err) {
    console.error('Get active discounts error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * POST /api/discounts/calculate
 * Calculate real backend price, item-level discounts, subtotal, discount, and finalAmount.
 */
router.post('/calculate', async (req, res) => {
  const { items, customerId, restaurantId } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Items array is required' });
  }

  try {
    // Check if customer has an ACTIVE platform subscription with remaining balance
    let hasActiveSubscription = false;
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      const activeSub = await CustomerSubscription.findOne({
        customerId,
        status: 'ACTIVE',
        endDate: { $gte: new Date() },
        remainingBalance: { $gt: 0 }
      });
      if (activeSub) hasActiveSubscription = true;
    }

    let subtotal = 0;
    let totalDiscount = 0;
    const calculatedItems = [];

    for (const item of items) {
      let unitPrice = Number(item.price) || 0;
      let itemName = item.name || 'Item';
      let rule = null;

      if (item.menu_item_id && mongoose.Types.ObjectId.isValid(item.menu_item_id)) {
        const dbItem = await MenuItem.findById(item.menu_item_id).lean();
        if (dbItem) {
          unitPrice = Number(dbItem.price);
          itemName = dbItem.name;
          rule = await ItemDiscountRule.findOne({ menuItemId: dbItem._id, isActive: true }).lean();
        }
      }

      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const itemSubtotal = Math.round((unitPrice * quantity) * 100) / 100;
      subtotal += itemSubtotal;

      // ─── NO-STACKING DISCOUNT LOGIC ───────────────────────────────────────
      let bulkPercent = 0;
      let subPercent = 0;

      if (rule) {
        if (rule.bulkMinQuantity > 0 && quantity >= rule.bulkMinQuantity && rule.bulkDiscountPercentage > 0) {
          bulkPercent = rule.bulkDiscountPercentage;
        }
        if (hasActiveSubscription && rule.subscriptionDiscountPercentage > 0) {
          subPercent = rule.subscriptionDiscountPercentage;
        }
      }

      // Pick higher discount (DO NOT STACK)
      let effectivePercent = 0;
      let discountType = 'NONE';

      if (subPercent > 0 && subPercent >= bulkPercent) {
        effectivePercent = subPercent;
        discountType = 'SUBSCRIPTION';
      } else if (bulkPercent > 0) {
        effectivePercent = bulkPercent;
        discountType = 'BULK';
      }

      const itemDiscount = Math.round((itemSubtotal * (effectivePercent / 100)) * 100) / 100;
      const itemFinal = Math.round((itemSubtotal - itemDiscount) * 100) / 100;

      totalDiscount += itemDiscount;

      calculatedItems.push({
        menu_item_id: item.menu_item_id || null,
        name: itemName,
        quantity,
        price: unitPrice,
        subtotal: itemSubtotal,
        discount_percentage: effectivePercent,
        discount_type: discountType,
        discount_amount: itemDiscount,
        final_price: itemFinal
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    totalDiscount = Math.round(totalDiscount * 100) / 100;
    const finalAmount = Math.max(0, Math.round((subtotal - totalDiscount) * 100) / 100);

    res.json({
      subtotal,
      discount: totalDiscount,
      discount_amount: totalDiscount,
      finalAmount,
      total_amount: finalAmount,
      hasActiveSubscription,
      items: calculatedItems
    });
  } catch (err) {
    console.error('Calculate discounts error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ─── SUPER ADMIN ONLY MANAGEMENT ENDPOINTS ──────────────────────────────────

const superAdminOnly = [auth, authorizeRoles('super_admin')];

/**
 * GET /api/discounts/superadmin/menu-items
 * Super Admin lists all menu items across restaurants (with optional restaurant filter).
 */
router.get('/superadmin/menu-items', ...superAdminOnly, async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const filter = {};
    if (restaurantId && restaurantId !== 'ALL' && mongoose.Types.ObjectId.isValid(restaurantId)) {
      filter.restaurantId = restaurantId;
    }
    const items = await MenuItem.find(filter)
      .populate('restaurantId', 'name slug')
      .populate('category_id', 'name')
      .sort({ name: 1 })
      .lean();
    res.json(items);
  } catch (err) {
    console.error('Get superadmin menu items error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * GET /api/discounts/superadmin/discounts
 * Super Admin lists all discount rules platform-wide.
 */
router.get('/superadmin/discounts', ...superAdminOnly, async (req, res) => {
  try {
    const rules = await ItemDiscountRule.find()
      .populate('menuItemId', 'name price image_url is_veg category_id')
      .populate('restaurantId', 'name slug')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json(rules);
  } catch (err) {
    console.error('Get superadmin discounts error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * POST /api/discounts/superadmin/discounts
 * Super Admin creates or updates a discount rule for a menu item.
 */
router.post('/superadmin/discounts', ...superAdminOnly, async (req, res) => {
  const { 
    menuItemId, 
    bulkMinQuantity = 0, 
    bulkDiscountPercentage = 0, 
    subscriptionDiscountPercentage = 0, 
    isActive = true 
  } = req.body;

  if (!menuItemId) {
    return res.status(400).json({ message: 'menuItemId is required.' });
  }

  try {
    const item = await MenuItem.findById(menuItemId);
    if (!item) {
      return res.status(404).json({ message: 'Menu Item not found.' });
    }

    let rule = await ItemDiscountRule.findOne({ menuItemId });
    if (rule) {
      rule.restaurantId = item.restaurantId || null;
      rule.bulkMinQuantity = Math.max(0, Number(bulkMinQuantity) || 0);
      rule.bulkDiscountPercentage = Math.min(100, Math.max(0, Number(bulkDiscountPercentage) || 0));
      rule.subscriptionDiscountPercentage = Math.min(100, Math.max(0, Number(subscriptionDiscountPercentage) || 0));
      rule.isActive = Boolean(isActive);
      rule.createdBy = req.user.id;
      await rule.save();
    } else {
      rule = new ItemDiscountRule({
        menuItemId,
        restaurantId: item.restaurantId || null,
        bulkMinQuantity: Math.max(0, Number(bulkMinQuantity) || 0),
        bulkDiscountPercentage: Math.min(100, Math.max(0, Number(bulkDiscountPercentage) || 0)),
        subscriptionDiscountPercentage: Math.min(100, Math.max(0, Number(subscriptionDiscountPercentage) || 0)),
        isActive: Boolean(isActive),
        createdBy: req.user.id
      });
      await rule.save();
    }

    const populated = await ItemDiscountRule.findById(rule._id)
      .populate('menuItemId', 'name price image_url')
      .populate('restaurantId', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Menu item discount rule saved successfully.',
      rule: populated
    });
  } catch (err) {
    console.error('Save superadmin discount error:', err.message);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

/**
 * PUT /api/superadmin/discounts/:id
 * Super Admin edits an existing discount rule.
 */
router.put('/superadmin/discounts/:id', ...superAdminOnly, async (req, res) => {
  const { 
    bulkMinQuantity, 
    bulkDiscountPercentage, 
    subscriptionDiscountPercentage, 
    isActive 
  } = req.body;

  try {
    const rule = await ItemDiscountRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Discount rule not found.' });
    }

    if (bulkMinQuantity !== undefined) rule.bulkMinQuantity = Math.max(0, Number(bulkMinQuantity) || 0);
    if (bulkDiscountPercentage !== undefined) rule.bulkDiscountPercentage = Math.min(100, Math.max(0, Number(bulkDiscountPercentage) || 0));
    if (subscriptionDiscountPercentage !== undefined) rule.subscriptionDiscountPercentage = Math.min(100, Math.max(0, Number(subscriptionDiscountPercentage) || 0));
    if (isActive !== undefined) rule.isActive = Boolean(isActive);

    await rule.save();

    const populated = await ItemDiscountRule.findById(rule._id)
      .populate('menuItemId', 'name price image_url')
      .populate('restaurantId', 'name slug');

    res.json({
      success: true,
      message: 'Discount rule updated successfully!',
      rule: populated
    });
  } catch (err) {
    console.error('Update discount rule error:', err.message);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

/**
 * PATCH /api/superadmin/discounts/:id/toggle
 * Super Admin toggles active status.
 */
router.patch('/superadmin/discounts/:id/toggle', ...superAdminOnly, async (req, res) => {
  try {
    const rule = await ItemDiscountRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Discount rule not found.' });
    }

    rule.isActive = !rule.isActive;
    await rule.save();

    res.json({
      success: true,
      message: `Discount rule is now ${rule.isActive ? 'ACTIVE' : 'INACTIVE'}`,
      isActive: rule.isActive
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

/**
 * DELETE /api/superadmin/discounts/:id
 * Super Admin deletes a discount rule.
 */
router.delete('/superadmin/discounts/:id', ...superAdminOnly, async (req, res) => {
  try {
    const rule = await ItemDiscountRule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Discount rule not found.' });
    }
    res.json({ success: true, message: 'Discount rule deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
