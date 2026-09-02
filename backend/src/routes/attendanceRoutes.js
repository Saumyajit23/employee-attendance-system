const express = require('express');
const router = express.Router();
const { protect, hrOnly } = require('../middleware/auth');
const {
    checkIn,
    checkOut,
    getAttendanceHistory,
    getTodayStatus,
    getAttendanceSummary
} = require('../controllers/attendanceController');

// Employee routes
router.post('/checkin', protect, checkIn);
router.post('/checkout', protect, checkOut);
router.get('/history', protect, getAttendanceHistory);
router.get('/status', protect, getTodayStatus);

// HR routes
router.get('/summary', protect, hrOnly, getAttendanceSummary);

module.exports = router;