const express = require('express');
const router = express.Router();

const Restaurant = require('../models/Restaurant');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');

const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

// Require auth and admin role
router.use(auth);
router.use(authorizeRoles('admin'));

// @route   GET /api/restaurant/profile
// @desc    Get current restaurant profile
router.get('/profile', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/restaurant/subscription
// @desc    Get active subscription details, plan limits, and current resource usage
router.get('/subscription', async (req, res) => {
  try {
    const sub = await Subscription.findOne({ restaurantId: req.restaurantId, status: 'active' }).populate('planId');
    if (!sub) return res.status(404).json({ message: 'No active subscription found' });

    // Fetch usage metrics
    const currentTables = await Table.countDocuments({ restaurantId: req.restaurantId });
    const currentMenuItems = await MenuItem.countDocuments({ restaurantId: req.restaurantId });
    const currentStaff = await User.countDocuments({ restaurantId: req.restaurantId, role: { $ne: 'admin' } });

    res.json({
      subscription: sub,
      usage: {
        tables: { current: currentTables, max: sub.planId.maxTables },
        menuItems: { current: currentMenuItems, max: sub.planId.maxMenuItems },
        staff: { current: currentStaff, max: sub.planId.maxStaff }
      }
    });
  } catch (err) {
    console.error('Get subscription usage error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/restaurant/subscription/renew
// @desc    Renew the current active plan (Simulated payment)
router.post('/subscription/renew', async (req, res) => {
  try {
    const sub = await Subscription.findOne({ restaurantId: req.restaurantId, status: 'active' });
    if (!sub) return res.status(404).json({ message: 'No active subscription found to renew' });

    // Extend endDate by 1 month or 1 year
    const oldEndDate = new Date(sub.endDate);
    const newEndDate = new Date(oldEndDate);
    if (sub.billingCycle === 'yearly') {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    } else {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    }

    sub.endDate = newEndDate;
    await sub.save();

    res.json({ success: true, message: 'Subscription successfully renewed!', endDate: newEndDate });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/restaurant/subscription/upgrade
// @desc    Upgrade subscription plan (Simulated)
router.post('/subscription/upgrade', async (req, res) => {
  const { planId, billingCycle } = req.body;
  if (!planId) return res.status(400).json({ message: 'Plan ID is required' });

  try {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ message: 'Subscription plan not found' });

    const activeSub = await Subscription.findOne({ restaurantId: req.restaurantId, status: 'active' });
    if (activeSub) {
      activeSub.status = 'cancelled';
      await activeSub.save();
    }

    const start = new Date();
    const end = new Date();
    if (billingCycle === 'yearly') {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setMonth(end.getMonth() + 1);
    }

    const amount = Number(plan.price) || Number(billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice) || 0;
    const commission = Number(plan.commissionPercentage) || 0;

    const newSub = new Subscription({
      restaurantId: req.restaurantId,
      planId: plan._id,
      status: 'active',
      startDate: start,
      endDate: end,
      billingCycle: billingCycle || 'monthly',
      amount: isNaN(amount) ? 0 : amount,
      commissionPercentage: commission,
      autoRenew: true
    });
    await newSub.save();

    res.json({ success: true, message: `Successfully upgraded to ${plan.name} plan!`, subscription: newSub });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
