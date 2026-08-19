const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/auth/login
// @desc    Authenticate user (Admin, Staff, Kitchen) & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        restaurantId: user.restaurantId
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback_secret_for_development',
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user._id,
            username: user.username,
            role: user.role,
            restaurantId: user.restaurantId
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET api/auth/me
// @desc    Get current user details
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let restaurant = null;
    let subscription = null;

    if (user.restaurantId) {
      const Restaurant = require('../models/Restaurant');
      const Subscription = require('../models/Subscription');

      restaurant = await Restaurant.findById(user.restaurantId);
      subscription = await Subscription.findOne({ restaurantId: user.restaurantId, status: 'active' });
    }

    res.json({
      id: user._id,
      username: user.username,
      role: user.role,
      restaurantId: user.restaurantId,
      restaurant,
      subscription,
      created_at: user.created_at
    });
  } catch (err) {
    console.error('Get user error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET api/auth/users
// @desc    Get all system users (Private - Admin only)
router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }
    const users = await User.find({ restaurantId: req.user.restaurantId }).select('-password_hash').sort({ created_at: -1 });
    const formatted = users.map(u => ({
      id: u._id,
      username: u.username,
      role: u.role,
      created_at: u.created_at
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Get users list error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST api/auth/users or api/auth/register
// @desc    Create a new system user (Private - Admin only)
router.post(['/users', '/register'], auth, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    // Limit check for staff
    const currentStaffCount = await User.countDocuments({ restaurantId: req.user.restaurantId });
    const Subscription = require('../models/Subscription');
    const SubscriptionPlan = require('../models/SubscriptionPlan');
    const sub = await Subscription.findOne({ restaurantId: req.user.restaurantId, status: 'active' });
    if (sub) {
      const plan = await SubscriptionPlan.findById(sub.planId);
      if (plan && plan.maxStaff !== -1 && currentStaffCount >= plan.maxStaff) {
        return res.status(400).json({ message: `Your current subscription allows a maximum of ${plan.maxStaff} staff members. Upgrade your plan to add more.` });
      }
    }

    const existing = await User.findOne({ username: username.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = new User({
      restaurantId: req.user.restaurantId,
      username: username.trim(),
      password_hash,
      role
    });

    await newUser.save();
    res.status(201).json({
      message: 'System user created successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('Create user error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE api/auth/users/:id
// @desc    Delete a system user (Private - Admin only)
router.delete('/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    // Prevent self deletion
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Self deletion is not allowed' });
    }

    const user = await User.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    await User.findOneAndDelete({ _id: req.params.id, restaurantId: req.user.restaurantId });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT api/auth/users/:id/password
// @desc    Change system user's password (Private - Admin only)
// @access  Private (Admin only)
router.put('/users/:id/password', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const { password } = req.body;
    if (!password || password.trim().length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const userObj = await User.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!userObj) return res.status(404).json({ message: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    userObj.password_hash = await bcrypt.hash(password, salt);
    await userObj.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT api/auth/users/:id
// @desc    Update system user's username & role (Private - Admin only)
// @access  Private (Admin only)
router.put('/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const { username, role } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const userObj = await User.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!userObj) return res.status(404).json({ message: 'User not found' });

    // Prevent role changes of self if it is the current logged in user (safety check)
    if (req.params.id === req.user.id && role !== userObj.role) {
      return res.status(400).json({ message: 'Self role modification is not allowed' });
    }

    // Check if new username is already taken by another user
    const duplicate = await User.findOne({ 
      username: username.trim(), 
      _id: { $ne: req.params.id } 
    });
    if (duplicate) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    userObj.username = username.trim();
    if (role) {
      userObj.role = role;
    }
    await userObj.save();

    res.json({ 
      message: 'User details updated successfully',
      user: {
        id: userObj._id,
        username: userObj.username,
        role: userObj.role
      }
    });
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST api/auth/push/subscribe
// @desc    Register push notification subscription for admin
// @access  Private (Admin/Staff/Kitchen)
router.post('/push/subscribe', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription payload' });
    }

    const PushSubscription = require('../models/PushSubscription');
    
    // Check if subscription already exists for this endpoint
    let sub = await PushSubscription.findOne({ 'subscription.endpoint': subscription.endpoint });
    
    if (sub) {
      // Update associated admin_id if needed
      sub.admin_id = req.user.id;
      await sub.save();
    } else {
      // Create new subscription entry
      sub = new PushSubscription({
        admin_id: req.user.id,
        subscription
      });
      await sub.save();
    }

    res.status(201).json({ message: 'Push subscription registered successfully' });
  } catch (err) {
    console.error('Push subscribe error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST api/auth/push/unsubscribe
// @desc    Remove push notification subscription
// @access  Private (Admin/Staff/Kitchen)
router.post('/push/unsubscribe', auth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ message: 'Endpoint is required' });
    }

    const PushSubscription = require('../models/PushSubscription');
    await PushSubscription.deleteOne({ 'subscription.endpoint': endpoint });
    
    res.json({ message: 'Push subscription removed successfully' });
  } catch (err) {
    console.error('Push unsubscribe error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
