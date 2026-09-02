const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    checkInTime: {
        type: Date,
        required: true
    },
    checkOutTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'half-day', 'leave', 'late'],
        default: 'present'
    },
    workingHours: {
        type: Number,
        default: 0
    },
    overtime: {
        type: Number,
        default: 0
    },
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    },
    deviceInfo: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Calculate working hours before saving
AttendanceSchema.pre('save', function(next) {
    if (this.checkInTime && this.checkOutTime) {
        const diffMs = this.checkOutTime - this.checkInTime;
        this.workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        
        // Calculate overtime (if working hours > 8)
        if (this.workingHours > 8) {
            this.overtime = parseFloat((this.workingHours - 8).toFixed(2));
        }
    }
    next();
});

// Index for faster queries
AttendanceSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);