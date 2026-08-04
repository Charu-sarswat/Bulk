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
