const express = require('express');
const router = express.Router();
const CateringEnquiry = require('../models/CateringEnquiry');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

// @route   POST /api/catering
// @desc    Submit a new catering inquiry (Public)
router.post('/', async (req, res) => {
  try {
    const { name, phone, event_date, guest_count, message } = req.body;

    if (!name || !phone || !event_date || !guest_count) {
      return res.status(400).json({ message: 'Name, phone, event date, and guest count are required' });
    }

    const newEnquiry = new CateringEnquiry({
      name,
      phone,
      event_date,
      guest_count,
      message: message || ''
    });

    await newEnquiry.save();

    res.status(201).json({ 
      message: 'Catering inquiry submitted successfully! Our team will contact you shortly.',
      enquiry: newEnquiry 
    });
  } catch (err) {
    console.error('Catering submit error:', err.message);
    res.status(500).json({ message: 'Server error processing catering enquiry' });
  }
});

// @route   GET /api/catering
// @desc    Get all catering inquiries (Admin/Staff)
router.get('/', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const enquiries = await CateringEnquiry.find().sort({ created_at: -1 });
    res.json(enquiries);
  } catch (err) {
    console.error('Catering list error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
