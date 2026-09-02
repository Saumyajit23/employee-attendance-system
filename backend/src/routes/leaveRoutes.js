const express = require('express');
const router = express.Router();
const { protect, hrOnly } = require('../middleware/auth');
const {
    applyLeave,
    getUserLeaves,
    updateLeaveStatus,
    getAllLeaves,
    cancelLeave
} = require('../controllers/leaveController');

// Employee routes
router.post('/', protect, applyLeave);
router.get('/', protect, getUserLeaves);
router.delete('/:id', protect, cancelLeave);

// HR routes
router.get('/all', protect, hrOnly, getAllLeaves);
router.put('/:id', protect, hrOnly, updateLeaveStatus);

module.exports = router;