const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Check-in
// @route   POST /api/attendance/checkin
// @access  Private
const checkIn = async (req, res) => {
    try {
        const { latitude, longitude, address, deviceInfo, notes } = req.body;
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already checked in today
        const existingAttendance = await Attendance.findOne({
            user: userId,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (existingAttendance) {
            return res.status(400).json({ 
                success: false,
                message: 'Already checked in today' 
            });
        }

        // Check if user is active
        const user = await User.findById(userId);
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Check if it's late (after 9:30 AM)
        const now = new Date();
        const cutoffTime = new Date(now);
        cutoffTime.setHours(9, 30, 0, 0);
        const status = now > cutoffTime ? 'late' : 'present';

        const attendance = await Attendance.create({
            user: userId,
            checkInTime: new Date(),
            location: {
                latitude,
                longitude,
                address
            },
            deviceInfo,
            notes,
            status
        });

        res.status(201).json({
            success: true,
            message: 'Check-in successful',
            attendance
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Check-out
// @route   POST /api/attendance/checkout
// @access  Private
const checkOut = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            user: userId,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            },
            checkOutTime: { $exists: false }
        });

        if (!attendance) {
            return res.status(400).json({ 
                success: false,
                message: 'No active check-in found for today' 
            });
        }

        attendance.checkOutTime = new Date();
        await attendance.save();

        const updatedAttendance = await Attendance.findById(attendance._id);

        res.json({
            success: true,
            message: 'Check-out successful',
            attendance: updatedAttendance
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get user's attendance history
// @route   GET /api/attendance/history
// @access  Private
const getAttendanceHistory = async (req, res) => {
    try {
        const { startDate, endDate, page = 1, limit = 30 } = req.query;
        const query = { user: req.user.id };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [attendance, total] = await Promise.all([
            Attendance.find(query)
                .sort({ date: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Attendance.countDocuments(query)
        ]);

        // Calculate statistics
        const totalDays = attendance.length;
        const totalHours = attendance.reduce((sum, record) => sum + record.workingHours, 0);
        const totalOvertime = attendance.reduce((sum, record) => sum + record.overtime, 0);
        const presentDays = attendance.filter(record => record.status === 'present').length;
        const lateDays = attendance.filter(record => record.status === 'late').length;

        res.json({
            success: true,
            attendance,
            stats: {
                totalDays,
                totalHours: parseFloat(totalHours.toFixed(2)),
                totalOvertime: parseFloat(totalOvertime.toFixed(2)),
                presentDays,
                lateDays,
                absentDays: totalDays - presentDays - lateDays
            },
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

// @desc    Get today's attendance status
// @route   GET /api/attendance/status
// @access  Private
const getTodayStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            user: userId,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        let status = {
            isCheckedIn: false,
            isCheckedOut: false,
            checkInTime: null,
            checkOutTime: null,
            workingHours: 0,
            status: 'absent'
        };

        if (attendance) {
            status.isCheckedIn = true;
            status.checkInTime = attendance.checkInTime;
            status.status = attendance.status || 'present';
            
            if (attendance.checkOutTime) {
                status.isCheckedOut = true;
                status.checkOutTime = attendance.checkOutTime;
                status.workingHours = attendance.workingHours || 0;
            }
        }

        res.json({ 
            success: true, 
            status 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get attendance summary (HR only)
// @route   GET /api/attendance/summary
// @access  Private/HR
const getAttendanceSummary = async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Get all employees
        const employees = await User.find({ role: 'employee', isActive: true });
        const totalEmployees = employees.length;

        // Get today's attendance
        const todayAttendance = await Attendance.find({
            date: {
                $gte: targetDate,
                $lt: nextDay
            }
        }).populate('user', 'name employeeId department');

        const checkedIn = todayAttendance.length;
        const checkedOut = todayAttendance.filter(a => a.checkOutTime).length;
        const present = todayAttendance.filter(a => a.status === 'present').length;
        const late = todayAttendance.filter(a => a.status === 'late').length;

        // Get department-wise breakdown
        const departmentStats = await Attendance.aggregate([
            {
                $match: {
                    date: {
                        $gte: targetDate,
                        $lt: nextDay
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            },
            {
                $group: {
                    _id: '$userDetails.department',
                    count: { $sum: 1 },
                    present: {
                        $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
                    },
                    late: {
                        $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
                    }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                date: targetDate,
                totalEmployees,
                checkedIn,
                checkedOut,
                present,
                late,
                absent: totalEmployees - checkedIn,
                attendanceRate: totalEmployees > 0 ? 
                    parseFloat(((checkedIn / totalEmployees) * 100).toFixed(2)) : 0,
                departmentStats
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

module.exports = {
    checkIn,
    checkOut,
    getAttendanceHistory,
    getTodayStatus,
    getAttendanceSummary
};