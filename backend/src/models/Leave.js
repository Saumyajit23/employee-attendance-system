const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['sick', 'casual', 'annual', 'maternity', 'paternity', 'other'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    totalDays: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedDate: {
        type: Date
    },
    remarks: {
        type: String,
        trim: true
    },
    attachment: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Calculate total days before saving
LeaveSchema.pre('save', function(next) {
    if (this.startDate && this.endDate) {
        const diffTime = Math.abs(this.endDate - this.startDate);
        this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    next();
});

// Index for faster queries
LeaveSchema.index({ user: 1, status: 1 });
LeaveSchema.index({ startDate: -1, endDate: -1 });

module.exports = mongoose.model('Leave', LeaveSchema);