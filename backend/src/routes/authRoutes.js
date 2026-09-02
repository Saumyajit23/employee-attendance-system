const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Validation rules
const registerValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('department').notEmpty().withMessage('Department is required'),
    body('position').notEmpty().withMessage('Position is required')
];

const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/update', protect, updateProfile);

module.exports = router;