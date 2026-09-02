const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, hrOnly } = require('../middleware/auth');

// @desc    Get all employees
// @route   GET /api/users
// @access  Private/HR
router.get('/', protect, hrOnly, async (req, res) => {
  try {
    const { role } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).select('-password');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;