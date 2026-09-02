import React, { useState, useEffect } from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Alert,
    Chip,
    Divider,
    LinearProgress,
    TextField,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    CheckCircleOutline,
    AccessTime,
    EventNote,
    TrendingUp,
    Schedule,
    Add,
    Cancel
} from '@mui/icons-material';
import { attendanceService, dashboardService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const [todayStatus, setTodayStatus] = useState(null);
    
    // NEW: State for leave features
    const [leaves, setLeaves] = useState([]);
    const [leaveBalance, setLeaveBalance] = useState({});
    const [openLeaveDialog, setOpenLeaveDialog] = useState(false);
    const [leaveFormData, setLeaveFormData] = useState({
        type: '',
        startDate: '',
        endDate: '',
        reason: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchDashboardData();
        fetchLeaves(); // NEW: Fetch leaves on load
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [dashboardRes, statusRes] = await Promise.all([
                dashboardService.getEmployeeDashboard(),
                attendanceService.getStatus()
            ]);
            setDashboardData(dashboardRes.data.data);
            setTodayStatus(statusRes.data.status);
            setError('');
        } catch (err) {
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // NEW: Fetch leaves
    const fetchLeaves = async () => {
        try {
            const response = await api.get('/leaves');
            setLeaves(response.data.leaves || []);
            setLeaveBalance(response.data.balance || {});
        } catch (err) {
            console.error('Failed to fetch leaves:', err);
        }
    };

    const handleCheckIn = async () => {
        try {
            setCheckingIn(true);
            await attendanceService.checkIn({
                latitude: 0,
                longitude: 0,
                deviceInfo: 'Web Browser'
            });
            await fetchDashboardData();
            alert('✅ Check-in successful!');
        } catch (err) {
            alert(err.response?.data?.message || 'Check-in failed');
        } finally {
            setCheckingIn(false);
        }
    };

    const handleCheckOut = async () => {
        try {
            setCheckingOut(true);
            await attendanceService.checkOut();
            await fetchDashboardData();
            alert('✅ Check-out successful!');
        } catch (err) {
            alert(err.response?.data?.message || 'Check-out failed');
        } finally {
            setCheckingOut(false);
        }
    };

    // NEW: Handle leave form input
    const handleLeaveInputChange = (e) => {
        setLeaveFormData({
            ...leaveFormData,
            [e.target.name]: e.target.value
        });
    };

    // NEW: Submit leave application
    const handleApplyLeave = async () => {
        if (!leaveFormData.type || !leaveFormData.startDate || !leaveFormData.endDate || !leaveFormData.reason) {
            alert('Please fill all fields');
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.post('/leaves', leaveFormData);
            if (response.data.success) {
                alert('✅ Leave applied successfully!');
                setOpenLeaveDialog(false);
                setLeaveFormData({ type: '', startDate: '', endDate: '', reason: '' });
                await fetchLeaves();
                await fetchDashboardData();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to apply leave');
        } finally {
            setSubmitting(false);
        }
    };

    // NEW: Cancel leave
    const handleCancelLeave = async (leaveId) => {
        if (!window.confirm('Are you sure you want to cancel this leave request?')) return;
        try {
            await api.delete(`/leaves/${leaveId}`);
            alert('✅ Leave cancelled successfully');
            await fetchLeaves();
            await fetchDashboardData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel leave');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                {error}
            </Alert>
        );
    }

    const { monthlyStats, leaveBalance: dashLeaveBalance, weeklyAttendance } = dashboardData || {};
    const today = todayStatus || {};
    // Use leaveBalance from API or fallback to dashboard data
    const balance = leaveBalance.total ? leaveBalance : dashLeaveBalance;

    const getStatusColor = (status) => {
        switch(status) {
            case 'present': return 'success';
            case 'late': return 'warning';
            case 'absent': return 'error';
            default: return 'default';
        }
    };

    const getLeaveStatusColor = (status) => {
        switch(status) {
            case 'approved': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'error';
            case 'cancelled': return 'default';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h4" gutterBottom>
                    Welcome back, {user?.name}! 👋
                </Typography>
                <Typography variant="subtitle1">
                    {user?.position} at {user?.department} Department
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                    Employee ID: {user?.employeeId}
                </Typography>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            onClick={handleCheckIn}
                            disabled={today?.isCheckedIn || checkingIn}
                            sx={{ py: 2 }}
                            startIcon={<CheckCircleOutline />}
                        >
                            {checkingIn ? 'Checking in...' : today?.isCheckedIn ? 'Already Checked In ✅' : 'Check In'}
                        </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="error"
                            onClick={handleCheckOut}
                            disabled={!today?.isCheckedIn || today?.isCheckedOut || checkingOut}
                            sx={{ py: 2 }}
                            startIcon={<Schedule />}
                        >
                            {checkingOut ? 'Checking out...' : today?.isCheckedOut ? 'Checked Out ✅' : 'Check Out'}
                        </Button>
                    </Grid>
                </Grid>
                {today?.isCheckedIn && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                            Checked in at: {new Date(today.checkInTime).toLocaleTimeString()}
                            {today?.isCheckedOut && ` | Checked out at: ${new Date(today.checkOutTime).toLocaleTimeString()}`}
                            {today?.workingHours > 0 && ` | Hours: ${today.workingHours}h`}
                        </Typography>
                        <Chip 
                            label={today.status?.toUpperCase() || 'PRESENT'} 
                            color={getStatusColor(today.status)}
                            size="small"
                            sx={{ mt: 1 }}
                        />
                    </Box>
                )}
            </Paper>

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography color="textSecondary" gutterBottom>
                                    Today's Status
                                </Typography>
                                <CheckCircleOutline color={today?.isCheckedIn ? 'success' : 'disabled'} />
                            </Box>
                            <Typography variant="h5">
                                {today?.isCheckedIn ? (today?.isCheckedOut ? 'Completed' : 'Active') : 'Not Started'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography color="textSecondary" gutterBottom>
                                    This Month
                                </Typography>
                                <AccessTime color="primary" />
                            </Box>
                            <Typography variant="h5">
                                {monthlyStats?.totalDays || 0} days
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {monthlyStats?.totalHours || 0} hours
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography color="textSecondary" gutterBottom>
                                    Leave Balance
                                </Typography>
                                <EventNote color="warning" />
                            </Box>
                            <Typography variant="h5">
                                {balance?.available || 0}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Used: {balance?.used || 0} / Total: {balance?.total || 0}
                            </Typography>
                            <LinearProgress 
                                variant="determinate" 
                                value={balance?.total > 0 ? ((balance?.used / balance?.total) * 100) : 0}
                                sx={{ mt: 1 }}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography color="textSecondary" gutterBottom>
                                    Overtime
                                </Typography>
                                <TrendingUp color="info" />
                            </Box>
                            <Typography variant="h5">
                                {monthlyStats?.totalOvertime || 0}h
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                This month
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {weeklyAttendance && weeklyAttendance.length > 0 && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        📊 Weekly Attendance
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                        {weeklyAttendance.map((day, index) => (
                            <Grid item xs key={index}>
                                <Box textAlign="center">
                                    <Typography variant="caption" display="block">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </Typography>
                                    <Chip 
                                        label={day.status?.toUpperCase() || 'ABSENT'}
                                        color={getStatusColor(day.status)}
                                        size="small"
                                        sx={{ mt: 1 }}
                                    />
                                    {day.workingHours > 0 && (
                                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                            {day.workingHours}h
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* ===== NEW: Apply Leave Button ===== */}
            <Box sx={{ mb: 3 }}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => setOpenLeaveDialog(true)}
                    sx={{ mr: 2 }}
                >
                    Apply for Leave
                </Button>
                <Chip 
                    label={`Pending: ${leaves.filter(l => l.status === 'pending').length}`}
                    color="warning"
                    size="small"
                />
            </Box>

            {/* ===== NEW: Leave History Table ===== */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    📋 Leave History
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {leaves.length === 0 ? (
                    <Typography color="textSecondary">No leave requests found</Typography>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Type</strong></TableCell>
                                    <TableCell><strong>From</strong></TableCell>
                                    <TableCell><strong>To</strong></TableCell>
                                    <TableCell align="center"><strong>Days</strong></TableCell>
                                    <TableCell align="center"><strong>Status</strong></TableCell>
                                    <TableCell align="center"><strong>Action</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {leaves.map((leave) => (
                                    <TableRow key={leave._id}>
                                        <TableCell>{leave.type.toUpperCase()}</TableCell>
                                        <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                                        <TableCell align="center">{leave.totalDays}</TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                label={leave.status.toUpperCase()}
                                                color={getLeaveStatusColor(leave.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            {leave.status === 'pending' && (
                                                <Button
                                                    size="small"
                                                    color="error"
                                                    startIcon={<Cancel />}
                                                    onClick={() => handleCancelLeave(leave._id)}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* ===== NEW: Apply Leave Dialog ===== */}
            <Dialog open={openLeaveDialog} onClose={() => setOpenLeaveDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>📝 Apply for Leave</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            select
                            fullWidth
                            label="Leave Type"
                            name="type"
                            value={leaveFormData.type}
                            onChange={handleLeaveInputChange}
                            margin="normal"
                            required
                        >
                            <MenuItem value="">Select Type</MenuItem>
                            <MenuItem value="sick">Sick Leave</MenuItem>
                            <MenuItem value="casual">Casual Leave</MenuItem>
                            <MenuItem value="annual">Annual Leave</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                        </TextField>
                        <TextField
                            fullWidth
                            label="Start Date"
                            name="startDate"
                            type="date"
                            value={leaveFormData.startDate}
                            onChange={handleLeaveInputChange}
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                            required
                        />
                        <TextField
                            fullWidth
                            label="End Date"
                            name="endDate"
                            type="date"
                            value={leaveFormData.endDate}
                            onChange={handleLeaveInputChange}
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Reason"
                            name="reason"
                            multiline
                            rows={3}
                            value={leaveFormData.reason}
                            onChange={handleLeaveInputChange}
                            margin="normal"
                            placeholder="Please provide reason for leave"
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenLeaveDialog(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handleApplyLeave}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmployeeDashboard;