const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const auth = require('../middleware/auth');

// @route   GET /api/settings
// @desc    Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await Setting.find();
    // Format as a simple key-value object for easy use
    const config = {};
    settings.forEach(s => {
      config[s.key] = s.value;
    });

    // Provide default values if not defined in DB
    if (config.delivery_fee === undefined) config.delivery_fee = 45;
    if (config.free_delivery_threshold === undefined) config.free_delivery_threshold = 399;
    if (config.is_delivery_enabled === undefined) config.is_delivery_enabled = true;
    if (config.is_store_open === undefined) config.is_store_open = true;
    if (config.store_opening_time === undefined) config.store_opening_time = '11:30';
    if (config.store_closing_time === undefined) config.store_closing_time = '23:30';
    if (config.store_closed_message === undefined) config.store_closed_message = 'We are currently closed for orders. Please visit during operating hours!';

    res.json(config);
  } catch (err) {
    console.error('Get settings error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/settings
// @desc    Update settings (admin only, authenticated)
router.post('/', auth, async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await Setting.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true }
      );
    }
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (err) {
    console.error('Update settings error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
