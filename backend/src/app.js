const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API is working!',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/dashboard', dashboardRoutes);
// Add this with other routes
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        success: false,
        message: 'Something went wrong!', 
        error: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        message: 'Route not found',
        path: req.originalUrl 
    });
});

module.exports = app;