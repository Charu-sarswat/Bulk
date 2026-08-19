const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const SubscriptionUsage = require('../models/SubscriptionUsage');
const SubscriptionPlan = require('../models/SubscriptionPlan');

// Secure all endpoints to admin/staff
router.use(auth);
router.use(authorizeRoles('admin', 'staff'));

// @route   GET /api/restaurant/mess-plans
// @desc    View platform subscription plans (Read-only for Restaurant Admin)
router.get('/', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
    res.json(plans);
  } catch (err) {
    console.error('Get platform plans error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Restaurant Admin is restricted from creating plans (Super Admin only)
router.post('/', async (req, res) => {
  return res.status(403).json({ message: 'Platform subscription plans can only be created by the Super Admin.' });
});

router.put('/:id', async (req, res) => {
  return res.status(403).json({ message: 'Platform subscription plans can only be modified by the Super Admin.' });
});

// @route   GET /api/restaurant/mess-plans/usages
// @desc    Get subscription consumption records ONLY at this restaurant
router.get('/usages', async (req, res) => {
  try {
    const usages = await SubscriptionUsage.find({ restaurantId: req.restaurantId })
      .populate('customerId', 'name phone email')
      .populate('orderId', 'order_number total_amount')
      .populate({
        path: 'subscriptionId',
        populate: { path: 'planId', select: 'name price prepaidBalance' }
      })
      .sort({ createdAt: -1 });

    const totalConsumed = usages.reduce((sum, u) => sum + (u.amount || 0), 0);

    const formatted = usages.map(u => ({
      id: u._id,
      studentName: u.customerId?.name || 'Customer',
      studentPhone: u.customerId?.phone || 'N/A',
      studentEmail: u.customerId?.email || 'N/A',
      planName: u.subscriptionId?.planId?.name || 'Platform Subscription',
      type: u.type || 'DEBIT',
      amount: u.amount,
      balanceBefore: u.balanceBefore,
      balanceAfter: u.balanceAfter,
      description: u.description,
      orderNumber: u.orderId?.order_number || 'N/A',
      usedAt: u.createdAt
    }));

    res.json({
      totalConsumed: Math.round(totalConsumed * 100) / 100,
      totalOrders: usages.length,
      usages: formatted
    });
  } catch (err) {
    console.error('Get subscription usages error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
