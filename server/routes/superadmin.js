const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const Restaurant = require('../models/Restaurant');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Subscription = require('../models/Subscription');
const PlatformTransaction = require('../models/PlatformTransaction');
const User = require('../models/User');
const Order = require('../models/Order');
const Setting = require('../models/Setting');

const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

// Protect all routes with auth and super_admin role check
router.use(auth);
router.use(authorizeRoles('super_admin'));

// @route   GET /api/superadmin/analytics
// @desc    Get platform-wide dashboard analytics
router.get('/analytics', async (req, res) => {
  try {
    const totalRestaurants = await Restaurant.countDocuments();
    const activeRestaurants = await Restaurant.countDocuments({ status: 'active' });
    const suspendedRestaurants = await Restaurant.countDocuments({ status: 'suspended' });

    const subscriptions = await Subscription.find();
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active' && new Date(s.endDate) > new Date()).length;
    const expiredSubscriptions = subscriptions.filter(s => s.status === 'expired' || new Date(s.endDate) <= new Date()).length;

    const orders = await Order.find();
    const totalOrders = orders.length;
    const totalGMV = orders.reduce((sum, o) => o.payment_status === 'paid' ? sum + o.total_amount : sum, 0);

    const platformTransactions = await PlatformTransaction.find();
    const platformCommissionRevenue = platformTransactions.reduce((sum, tx) => sum + (tx.commissionAmount || 0), 0);
    const subscriptionRevenue = subscriptions.reduce((sum, s) => sum + (s.amount || 0), 0);

    // Calculate restaurant-wise performance
    const restaurantAnalytics = [];
    const restaurants = await Restaurant.find();
    for (const r of restaurants) {
      const rOrders = orders.filter(o => o.restaurantId?.toString() === r._id.toString());
      const rGMV = rOrders.reduce((sum, o) => o.payment_status === 'paid' ? sum + o.total_amount : sum, 0);
      const rSub = await Subscription.findOne({ restaurantId: r._id, status: 'active' }).populate('planId');
      
      restaurantAnalytics.push({
        id: r._id,
        name: r.name,
        slug: r.slug,
        ownerName: r.ownerName,
        status: r.status,
        planName: rSub?.planId?.name || 'No Active Plan',
        totalOrders: rOrders.length,
        gmv: Math.round(rGMV * 100) / 100
      });
    }

    res.json({
      summary: {
        totalRestaurants,
        activeRestaurants,
        suspendedRestaurants,
        activeSubscriptions,
        expiredSubscriptions,
        totalOrders,
        totalGMV: Math.round(totalGMV * 100) / 100,
        subscriptionRevenue: Math.round(subscriptionRevenue * 100) / 100,
        platformCommissionRevenue: Math.round(platformCommissionRevenue * 100) / 100
      },
      restaurants: restaurantAnalytics
    });
  } catch (err) {
    console.error('Superadmin analytics error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/superadmin/restaurants
// @desc    Get all restaurants list with their active subscriptions
router.get('/restaurants', async (req, res) => {
  try {
    const list = await Restaurant.find().sort({ createdAt: -1 });
    const formatted = [];

    for (const r of list) {
      const activeSub = await Subscription.findOne({ restaurantId: r._id, status: 'active' }).populate('planId');
      const adminUser = await User.findOne({ restaurantId: r._id, role: 'admin' });

      formatted.push({
        id: r._id,
        name: r.name,
        slug: r.slug,
        ownerName: r.ownerName,
        email: r.email,
        phone: r.phone,
        address: r.address,
        city: r.city,
        state: r.state,
        pincode: r.pincode,
        logo: r.logo,
        status: r.status,
        isActive: r.isActive,
        subscription: activeSub ? {
          id: activeSub._id,
          planName: activeSub.planId?.name || 'N/A',
          endDate: activeSub.endDate,
          status: activeSub.status
        } : null,
        adminUsername: adminUser ? adminUser.username : 'N/A',
        createdAt: r.createdAt
      });
    }

    res.json(formatted);
  } catch (err) {
    console.error('Get restaurants list error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/superadmin/restaurants
// @desc    Create a new restaurant, its administrator, and active subscription plan
router.post('/restaurants', async (req, res) => {
  const {
    name, slug, ownerName, email, phone, address, city, state, pincode, logo,
    planId, billingCycle, startDate, durationMonths,
    adminUsername, adminPassword
  } = req.body;

  if (!name || !slug || !adminUsername || !adminPassword || !planId) {
    return res.status(400).json({ message: 'Name, slug, admin credentials, and subscription plan are required.' });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Check if slug or adminUsername already exists
    const existingSlug = await Restaurant.findOne({ slug: slug.toLowerCase() }).session(session);
    if (existingSlug) {
      await session.abortTransaction();
      return res.status(400).json({ message: `Restaurant with slug "${slug}" already exists.` });
    }

    const existingAdmin = await User.findOne({ username: adminUsername.trim() }).session(session);
    if (existingAdmin) {
      await session.abortTransaction();
      return res.status(400).json({ message: `Administrator username "${adminUsername}" is already taken.` });
    }

    // 2. Fetch Subscription Plan
    const plan = await SubscriptionPlan.findById(planId).session(session);
    if (!plan) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Subscription plan not found.' });
    }

    // 3. Create Restaurant
    const restaurant = new Restaurant({
      name,
      slug: slug.toLowerCase(),
      ownerName,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      logo: logo || '',
      status: 'active',
      isActive: true
    });
    await restaurant.save({ session });

    // 4. Create Restaurant Admin
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(adminPassword, salt);

    const admin = new User({
      restaurantId: restaurant._id,
      username: adminUsername.trim(),
      password_hash,
      role: 'admin'
    });
    await admin.save({ session });

    // 5. Create Subscription
    const months = Number(durationMonths || 1);
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);

    const planPrice = Number(plan.price) || Number(billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice) || 0;
    const amountPaid = isNaN(planPrice * months) ? 0 : planPrice * months;
    const commission = Number(plan.commissionPercentage) || 0;

    const subscription = new Subscription({
      restaurantId: restaurant._id,
      planId: plan._id,
      status: 'active',
      startDate: start,
      endDate: end,
      billingCycle: billingCycle || 'monthly',
      amount: amountPaid,
      commissionPercentage: commission,
      autoRenew: true
    });
    await subscription.save({ session });

    // Seed default settings for the new restaurant
    await Setting.create([{
      restaurantId: restaurant._id,
      key: 'is_store_open',
      value: true
    }, {
      restaurantId: restaurant._id,
      key: 'delivery_fee',
      value: 40
    }, {
      restaurantId: restaurant._id,
      key: 'free_delivery_threshold',
      value: 399
    }], { session, ordered: true });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Restaurant, Administrator, and Subscription successfully created.',
      restaurantId: restaurant._id
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Create restaurant transaction error:', err.message);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// @route   PUT /api/superadmin/restaurants/:id
// @desc    Edit restaurant details
router.put('/restaurants/:id', async (req, res) => {
  try {
    const { name, ownerName, email, phone, address, city, state, pincode, logo } = req.body;
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    if (name) restaurant.name = name;
    if (ownerName) restaurant.ownerName = ownerName;
    if (email) restaurant.email = email;
    if (phone) restaurant.phone = phone;
    if (address) restaurant.address = address;
    if (city) restaurant.city = city;
    if (state) restaurant.state = state;
    if (pincode) restaurant.pincode = pincode;
    if (logo) restaurant.logo = logo;

    await restaurant.save();
    res.json({ success: true, message: 'Restaurant details updated successfully' });
  } catch (err) {
    console.error('Update restaurant error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PATCH /api/superadmin/restaurants/:id/status
// @desc    Activate/Suspend/Deactivate restaurant status
router.patch('/restaurants/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    restaurant.status = status;
    restaurant.isActive = status === 'active';
    await restaurant.save();

    res.json({ success: true, message: `Restaurant status updated to ${status}` });
  } catch (err) {
    console.error('Toggle status error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// ─── PLATFORM STUDENT SUBSCRIPTIONS (SUPER ADMIN ONLY) ──────────────────

// @route   GET /api/superadmin/plans
// @desc    Get all platform student subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ price: 1 });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/superadmin/plans
// @desc    Create platform subscription plan (Super Admin only)
router.post('/plans', async (req, res) => {
  try {
    const { name, description, price, durationDays, prepaidBalance, isActive } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Name and Price are required.' });
    }

    const newPlan = new SubscriptionPlan({
      name: name.trim(),
      description: description || '',
      price: Number(price),
      durationDays: Number(durationDays || 30),
      prepaidBalance: Number(prepaidBalance !== undefined ? prepaidBalance : price),
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    });

    await newPlan.save();
    res.status(201).json(newPlan);
  } catch (err) {
    console.error('Create platform plan error:', err.message);
    res.status(500).json({ message: err.message || 'Server Error' });
  }
});

// @route   PUT /api/superadmin/plans/:id
// @desc    Update platform subscription plan
router.put('/plans/:id', async (req, res) => {
  try {
    const { name, description, price, durationDays, prepaidBalance, isActive } = req.body;
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    if (name) plan.name = name.trim();
    if (description !== undefined) plan.description = description;
    if (price !== undefined) plan.price = Number(price);
    if (durationDays !== undefined) plan.durationDays = Number(durationDays);
    if (prepaidBalance !== undefined) plan.prepaidBalance = Number(prepaidBalance);
    if (isActive !== undefined) plan.isActive = Boolean(isActive);

    await plan.save();
    res.json(plan);
  } catch (err) {
    console.error('Update plan error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/superadmin/plans/:id
// @desc    Delete or deactivate platform plan
router.delete('/plans/:id', async (req, res) => {
  try {
    await SubscriptionPlan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Plan deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/superadmin/customer-subscriptions
// @desc    List all student customer subscriptions with payment verification status
router.get('/customer-subscriptions', async (req, res) => {
  try {
    const CustomerSubscription = require('../models/CustomerSubscription');
    const subs = await CustomerSubscription.find()
      .populate('customerId', 'name phone email')
      .populate('planId', 'name description price durationDays prepaidBalance')
      .sort({ createdAt: -1 });

    const formatted = subs.map(s => {
      const init = s.initialBalance || s.planId?.prepaidBalance || 0;
      const rem = s.remainingBalance !== undefined ? s.remainingBalance : init;
      return {
        id: s._id,
        studentName: s.customerId?.name || 'Unknown Student',
        studentPhone: s.customerId?.phone || 'N/A',
        studentEmail: s.customerId?.email || 'N/A',
        planName: s.planId?.name || 'Platform Plan',
        price: s.planId?.price || init,
        initialBalance: init,
        remainingBalance: rem,
        usedAmount: Math.max(0, init - rem),
        status: s.status,
        paymentReference: s.paymentReference || 'N/A',
        startDate: s.startDate,
        endDate: s.endDate,
        createdAt: s.createdAt
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Get customer subs error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/superadmin/customer-subscriptions/:id/verify
// @desc    Super Admin verifies and activates student subscription payment
router.post('/customer-subscriptions/:id/verify', async (req, res) => {
  try {
    const CustomerSubscription = require('../models/CustomerSubscription');
    const sub = await CustomerSubscription.findById(req.params.id).populate('planId');
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });

    // Check if customer already has another active subscription with balance > 0
    const existingActive = await CustomerSubscription.findOne({
      _id: { $ne: sub._id },
      customerId: sub.customerId,
      status: 'ACTIVE',
      endDate: { $gte: new Date() },
      remainingBalance: { $gt: 0 }
    });

    if (existingActive) {
      return res.status(400).json({
        message: `Customer already has an active subscription with ₹${existingActive.remainingBalance.toFixed(0)} remaining balance (valid until ${new Date(existingActive.endDate).toLocaleDateString('en-IN')}). They cannot activate another subscription until the current one reaches ₹0 or expires.`
      });
    }

    const duration = sub.planId?.durationDays || 30;
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + duration);

    sub.status = 'ACTIVE';
    sub.startDate = start;
    sub.endDate = end;
    if (sub.remainingBalance === undefined || sub.remainingBalance === 0) {
      sub.remainingBalance = sub.initialBalance || sub.planId?.prepaidBalance || sub.planId?.price || 5000;
    }
    sub.verifiedBy = req.user.id;
    sub.verifiedAt = new Date();

    await sub.save();
    res.json({ success: true, message: 'Subscription successfully verified and activated!', subscription: sub });
  } catch (err) {
    console.error('Verify subscription error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/superadmin/customer-subscriptions/:id/reject
// @desc    Super Admin rejects invalid subscription payment request
router.post('/customer-subscriptions/:id/reject', async (req, res) => {
  try {
    const CustomerSubscription = require('../models/CustomerSubscription');
    const sub = await CustomerSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });

    sub.status = 'REJECTED';
    await sub.save();
    res.json({ success: true, message: 'Subscription request rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/superadmin/subscription-reports
// @desc    Get Platform Subscription Revenue & Restaurant Settlement / Usage Breakdown
router.get('/subscription-reports', async (req, res) => {
  try {
    const CustomerSubscription = require('../models/CustomerSubscription');
    const SubscriptionUsage = require('../models/SubscriptionUsage');

    // 1. Total Subscription Sales (All Active or Paid Subscriptions)
    const allSubs = await CustomerSubscription.find({ status: { $in: ['ACTIVE', 'EXPIRED'] } });
    const totalSales = allSubs.reduce((sum, s) => sum + (s.initialBalance || 0), 0);

    // 2. Total Subscription Amount Consumed across all restaurants
    const usages = await SubscriptionUsage.find()
      .populate('customerId', 'name phone')
      .populate('restaurantId', 'name slug')
      .populate('orderId', 'order_number total_amount')
      .sort({ createdAt: -1 });

    const totalConsumed = usages.reduce((sum, u) => sum + (u.amount || 0), 0);
    const outstandingBalance = Math.max(0, totalSales - totalConsumed);

    // 3. Restaurant-Wise Breakdown
    const restaurants = await Restaurant.find();
    const restaurantBreakdown = restaurants.map(r => {
      const rUsages = usages.filter(u => (u.restaurantId?._id || u.restaurantId)?.toString() === r._id.toString());
      const rConsumed = rUsages.reduce((sum, u) => sum + (u.amount || 0), 0);
      return {
        restaurantId: r._id,
        name: r.name,
        slug: r.slug,
        ownerName: r.ownerName,
        totalConsumed: Math.round(rConsumed * 100) / 100,
        orderCount: rUsages.length
      };
    }).filter(r => r.totalConsumed > 0 || r.orderCount > 0);

    res.json({
      summary: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalConsumed: Math.round(totalConsumed * 100) / 100,
        outstandingBalance: Math.round(outstandingBalance * 100) / 100,
        activeSubscriptionsCount: allSubs.filter(s => s.status === 'ACTIVE').length,
        totalUsagesCount: usages.length
      },
      restaurantBreakdown,
      recentUsages: usages.slice(0, 50).map(u => ({
        id: u._id,
        studentName: u.customerId?.name || 'Customer',
        studentPhone: u.customerId?.phone || 'N/A',
        restaurantName: u.restaurantId?.name || 'Restaurant',
        orderNumber: u.orderId?.order_number || 'N/A',
        amount: u.amount,
        balanceBefore: u.balanceBefore,
        balanceAfter: u.balanceAfter,
        description: u.description,
        createdAt: u.createdAt
      }))
    });
  } catch (err) {
    console.error('Subscription reports error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/superadmin/platform-upi
// @desc    Get Super Admin Platform UPI payment details
router.get('/platform-upi', async (req, res) => {
  try {
    const upiIdSetting = await Setting.findOne({ key: 'platform_upi_id' });
    const upiNameSetting = await Setting.findOne({ key: 'platform_upi_name' });
    const upiQrSetting = await Setting.findOne({ key: 'platform_upi_qr' });

    res.json({
      upiId: upiIdSetting?.value || 'superadmin@upi',
      payeeName: upiNameSetting?.value || 'Bombay Chowpati Platform Admin',
      qrImage: upiQrSetting?.value || ''
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/superadmin/platform-upi
// @desc    Update Super Admin Platform UPI payment details
router.put('/platform-upi', async (req, res) => {
  try {
    const { upiId, payeeName, qrImage } = req.body;
    
    if (upiId !== undefined) {
      await Setting.findOneAndUpdate(
        { key: 'platform_upi_id' },
        { key: 'platform_upi_id', value: upiId },
        { upsert: true }
      );
    }
    if (payeeName !== undefined) {
      await Setting.findOneAndUpdate(
        { key: 'platform_upi_name' },
        { key: 'platform_upi_name', value: payeeName },
        { upsert: true }
      );
    }
    if (qrImage !== undefined) {
      await Setting.findOneAndUpdate(
        { key: 'platform_upi_qr' },
        { key: 'platform_upi_qr', value: qrImage },
        { upsert: true }
      );
    }

    res.json({ success: true, message: 'Platform UPI configuration updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/superadmin/transactions
// @desc    Get platform-wide order transaction commission records
router.get('/transactions', async (req, res) => {
  try {
    const txs = await PlatformTransaction.find()
      .populate('restaurantId', 'name')
      .populate('orderId', 'order_number')
      .sort({ createdAt: -1 });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
