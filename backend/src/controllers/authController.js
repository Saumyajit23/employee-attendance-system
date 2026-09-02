const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const { email, password, name, employeeId, department, position, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ 
            $or: [{ email }, { employeeId }] 
        });
        
        if (userExists) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists' 
            });
        }

        // Create user
        const user = await User.create({
            email,
            password,
            name,
            employeeId,
            department,
            position,
            role: role || 'employee'
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                employeeId: user.employeeId,
                department: user.department,
                position: user.position,
                totalLeaves: user.totalLeaves,
                usedLeaves: user.usedLeaves
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Please provide email and password' 
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                employeeId: user.employeeId,
                department: user.department,
                position: user.position,
                totalLeaves: user.totalLeaves,
                usedLeaves: user.usedLeaves
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({ 
            success: true, 
            user 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/update
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { name, phoneNumber, profileImage } = req.body;
        const user = await User.findById(req.user.id);

        if (name) user.name = name;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (profileImage) user.profileImage = profileImage;

        await user.save();

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                employeeId: user.employeeId,
                department: user.department,
                position: user.position,
                phoneNumber: user.phoneNumber,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

module.exports = { register, login, getMe, updateProfile };