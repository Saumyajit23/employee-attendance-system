const express = require('express');
const router = express.Router();
const { protect, hrOnly } = require('../middleware/auth');
const {
    getHRDashboard,
    getEmployeeDashboard
} = require('../controllers/dashboardController');

router.get('/hr', protect, hrOnly, getHRDashboard);
router.get('/employee', protect, getEmployeeDashboard);

module.exports = router;