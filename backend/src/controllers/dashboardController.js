const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

// @desc    Get HR dashboard data
// @route   GET /api/dashboard/hr
// @access  Private/HR
const getHRDashboard = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get total employees
        const totalEmployees = await User.countDocuments({ 
            role: 'employee', 
            isActive: true 
        });

        // Get today's attendance
        const todayAttendance = await Attendance.find({
            date: {
                $gte: today,
                $lt: tomorrow
            }
        });

        const checkedIn = todayAttendance.length;
        const checkedOut = todayAttendance.filter(a => a.checkOutTime).length;
        const present = todayAttendance.filter(a => a.status === 'present').length;
        const late = todayAttendance.filter(a => a.status === 'late').length;

        // Get pending leaves
        const pendingLeaves = await Leave.countDocuments({ 
            status: 'pending' 
        });

        // Get recent attendance
        const recentAttendance = await Attendance.find()
            .populate('user', 'name email department')
            .sort({ date: -1 })
            .limit(10);

        // Get monthly statistics
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthlyAttendance = await Attendance.find({
            date: {
                $gte: firstDayOfMonth,
                $lt: tomorrow
            }
        });

        const totalWorkingHours = monthlyAttendance.reduce((sum, record) => sum + record.workingHours, 0);
        const totalOvertime = monthlyAttendance.reduce((sum, record) => sum + record.overtime, 0);

        // Department-wise employee count
        const departmentStats = await User.aggregate([
            {
                $match: { role: 'employee', isActive: true }
            },
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Monthly trend (last 30 days)
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const monthlyTrend = await Attendance.aggregate([
            {
                $match: {
                    date: {
                        $gte: thirtyDaysAgo,
                        $lt: tomorrow
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        day: { $dayOfMonth: '$date' }
                    },
                    count: { $sum: 1 },
                    totalHours: { $sum: '$workingHours' }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);

        res.json({
            success: true,
            data: {
                totalEmployees,
                todayAttendance: {
                    checkedIn,
                    checkedOut,
                    present,
                    late,
                    absent: totalEmployees - checkedIn,
                    attendanceRate: totalEmployees > 0 ? 
                        parseFloat(((checkedIn / totalEmployees) * 100).toFixed(2)) : 0
                },
                pendingLeaves,
                monthlyStats: {
                    totalWorkingHours: parseFloat(totalWorkingHours.toFixed(2)),
                    totalOvertime: parseFloat(totalOvertime.toFixed(2)),
                    totalDays: monthlyAttendance.length
                },
                recentAttendance,
                departmentStats,
                monthlyTrend
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get Employee dashboard data
// @route   GET /api/dashboard/employee
// @access  Private
const getEmployeeDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user details
        const user = await User.findById(userId).select('-password');

        // Get today's attendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAttendance = await Attendance.findOne({
            user: userId,
            date: {
                $gte: today,
                $lt: tomorrow
            }
        });

        // Get this month's attendance
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthlyAttendance = await Attendance.find({
            user: userId,
            date: {
                $gte: firstDayOfMonth,
                $lt: tomorrow
            }
        });

        const totalHours = monthlyAttendance.reduce((sum, record) => sum + record.workingHours, 0);
        const totalOvertime = monthlyAttendance.reduce((sum, record) => sum + record.overtime, 0);
        const presentDays = monthlyAttendance.filter(a => a.status === 'present').length;
        const lateDays = monthlyAttendance.filter(a => a.status === 'late').length;

        // Get leave balance
        const approvedLeaves = await Leave.find({
            user: userId,
            status: 'approved'
        });
        const usedLeaves = approvedLeaves.reduce((sum, l) => sum + l.totalDays, 0);
        const leaveBalance = user.totalLeaves - usedLeaves;

        // Get pending leave count
        const pendingLeaves = await Leave.countDocuments({
            user: userId,
            status: 'pending'
        });

        // Get recent leaves
        const recentLeaves = await Leave.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(5);

        // Get attendance for last 7 days
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const weeklyAttendance = await Attendance.find({
            user: userId,
            date: {
                $gte: lastWeek,
                $lt: tomorrow
            }
        }).sort({ date: 1 });

        res.json({
            success: true,
            data: {
                user,
                todayStatus: todayAttendance ? {
                    checkedIn: true,
                    checkInTime: todayAttendance.checkInTime,
                    checkedOut: !!todayAttendance.checkOutTime,
                    checkOutTime: todayAttendance.checkOutTime || null,
                    workingHours: todayAttendance.workingHours || 0,
                    status: todayAttendance.status
                } : {
                    checkedIn: false,
                    status: 'absent'
                },
                monthlyStats: {
                    totalDays: monthlyAttendance.length,
                    totalHours: parseFloat(totalHours.toFixed(2)),
                    totalOvertime: parseFloat(totalOvertime.toFixed(2)),
                    presentDays,
                    lateDays,
                    absentDays: monthlyAttendance.length - presentDays - lateDays
                },
                leaveBalance: {
                    total: user.totalLeaves,
                    used: usedLeaves,
                    available: leaveBalance,
                    pending: pendingLeaves
                },
                recentLeaves,
                weeklyAttendance: weeklyAttendance.map(a => ({
                    date: a.date,
                    status: a.status,
                    workingHours: a.workingHours
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

module.exports = { getHRDashboard, getEmployeeDashboard };