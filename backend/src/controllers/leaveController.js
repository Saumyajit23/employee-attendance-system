const Leave = require('../models/Leave');
const User = require('../models/User');

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private
const applyLeave = async (req, res) => {
    try {
        const { type, startDate, endDate, reason, attachment } = req.body;
        const userId = req.user.id;

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start > end) {
            return res.status(400).json({
                success: false,
                message: 'Start date must be before end date'
            });
        }

        if (start < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot apply for past dates'
            });
        }

        // Calculate total days
        const diffTime = Math.abs(end - start);
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        // Check if user has enough leave balance
        const user = await User.findById(userId);
        const availableLeaves = user.totalLeaves - user.usedLeaves;

        if (totalDays > availableLeaves) {
            return res.status(400).json({
                success: false,
                message: `Insufficient leave balance. Available: ${availableLeaves}, Requested: ${totalDays}`
            });
        }

        // Check for overlapping leaves
        const overlappingLeave = await Leave.findOne({
            user: userId,
            status: { $in: ['pending', 'approved'] },
            $or: [
                {
                    startDate: { $lte: end },
                    endDate: { $gte: start }
                }
            ]
        });

        if (overlappingLeave) {
            return res.status(400).json({
                success: false,
                message: 'You already have a leave request for this period'
            });
        }

        // Create leave application
        const leave = await Leave.create({
            user: userId,
            type,
            startDate: start,
            endDate: end,
            totalDays,
            reason,
            attachment
        });

        res.status(201).json({
            success: true,
            message: 'Leave application submitted successfully',
            leave
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get user's leaves
// @route   GET /api/leaves
// @access  Private
const getUserLeaves = async (req, res) => {
    try {
        const { status, year } = req.query;
        const query = { user: req.user.id };

        if (status) {
            query.status = status;
        }

        if (year) {
            const startYear = new Date(parseInt(year), 0, 1);
            const endYear = new Date(parseInt(year), 11, 31);
            query.startDate = { $gte: startYear, $lte: endYear };
        }

        const leaves = await Leave.find(query)
            .sort({ createdAt: -1 });

        // Get leave balance
        const user = await User.findById(req.user.id);
        const approvedLeaves = await Leave.find({
            user: req.user.id,
            status: 'approved'
        });

        const totalApprovedDays = approvedLeaves.reduce((sum, leave) => sum + leave.totalDays, 0);

        // Get pending count
        const pendingCount = await Leave.countDocuments({
            user: req.user.id,
            status: 'pending'
        });

        res.json({
            success: true,
            leaves,
            balance: {
                total: user.totalLeaves,
                used: totalApprovedDays,
                available: user.totalLeaves - totalApprovedDays,
                pending: pendingCount
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Update leave status (HR only)
// @route   PUT /api/leaves/:id
// @access  Private/HR
const updateLeaveStatus = async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const leaveId = req.params.id;

        const leave = await Leave.findById(leaveId);
        if (!leave) {
            return res.status(404).json({ 
                success: false,
                message: 'Leave not found' 
            });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({ 
                success: false,
                message: 'Leave already processed' 
            });
        }

        // If approving, check leave balance again
        if (status === 'approved') {
            const user = await User.findById(leave.user);
            const availableLeaves = user.totalLeaves - user.usedLeaves;
            
            if (leave.totalDays > availableLeaves) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient leave balance. Available: ${availableLeaves}, Requested: ${leave.totalDays}`
                });
            }

            user.usedLeaves += leave.totalDays;
            await user.save();
        }

        leave.status = status;
        leave.remarks = remarks;
        leave.approvedBy = req.user.id;
        leave.approvedDate = new Date();

        await leave.save();

        res.json({
            success: true,
            message: `Leave ${status}`,
            leave
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get all leave requests (HR only)
// @route   GET /api/leaves/all
// @access  Private/HR
const getAllLeaves = async (req, res) => {
    try {
        const { status, department, page = 1, limit = 20 } = req.query;
        const query = {};
        
        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const leavesQuery = Leave.find(query)
            .populate('user', 'name employeeId email department position')
            .sort({ createdAt: -1 });

        if (department) {
            leavesQuery.populate({
                path: 'user',
                match: { department }
            });
        }

        const [leaves, total] = await Promise.all([
            leavesQuery.skip(skip).limit(parseInt(limit)),
            Leave.countDocuments(query)
        ]);

        // Filter out leaves where user was null (if department filter was used)
        const filteredLeaves = leaves.filter(l => l.user !== null);

        res.json({
            success: true,
            leaves: filteredLeaves,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalRecords: total
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Cancel leave request (Employee)
// @route   DELETE /api/leaves/:id
// @access  Private
const cancelLeave = async (req, res) => {
    try {
        const leaveId = req.params.id;
        const leave = await Leave.findById(leaveId);

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave not found'
            });
        }

        if (leave.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this leave'
            });
        }

        if (leave.status === 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel approved leave'
            });
        }

        leave.status = 'cancelled';
        await leave.save();

        res.json({
            success: true,
            message: 'Leave cancelled successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    applyLeave,
    getUserLeaves,
    updateLeaveStatus,
    getAllLeaves,
    cancelLeave
};