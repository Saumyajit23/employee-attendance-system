import React, { useState, useEffect } from 'react';
import api, { attendanceService, leaveService, dashboardService } from '../../services/api';
import './Dashboard.css';

const HRDashboard = () => {
  const [data, setData] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('pending');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashRes, leavesRes, employeesRes] = await Promise.all([
        dashboardService.getHRDashboard(),
        leaveService.getAllLeaves({ status: 'pending' }),
        api.get('/users?role=employee')
      ]);
      setData(dashRes.data.data);
      setLeaves(leavesRes.data.leaves || []);
      setEmployees(employeesRes.data.users || []);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this leave?`)) return;
    try {
      await leaveService.updateStatus(id, { status, remarks: 'Processed by HR' });
      await fetchData();
      alert(`✅ Leave ${status} successfully!`);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to process leave');
    }
  };

  const handleViewAllLeaves = async (status = 'all') => {
    try {
      setLoading(true);
      const params = status !== 'all' ? { status } : {};
      const response = await leaveService.getAllLeaves(params);
      setLeaves(response.data.leaves || []);
      setSelectedStatus(status);
    } catch (e) {
      alert('Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'rejected': return '#f44336';
      case 'cancelled': return '#9e9e9e';
      default: return '#666';
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  const { totalEmployees, todayAttendance, pendingLeaves: pendingLeavesCount, departmentStats } = data || {};

  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>📊 HR Dashboard</h2>
          <p style={{ color: '#666' }}>Company Overview & Attendance Management</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => { fetchData(); alert('Data refreshed!'); }}
          style={{ padding: '8px 20px' }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Employees</h3>
          <p>{totalEmployees || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Today's Attendance</h3>
          <p>{todayAttendance?.checkedIn || 0}</p>
          <small>Present: {todayAttendance?.present || 0} | Late: {todayAttendance?.late || 0}</small>
          <br />
          <small>Rate: {todayAttendance?.attendanceRate || 0}%</small>
        </div>
        <div className="stat-card">
          <h3>Pending Leaves</h3>
          <p style={{ color: '#ff9800' }}>{pendingLeavesCount || 0}</p>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '10px', padding: '5px 15px', fontSize: '12px' }}
            onClick={() => document.getElementById('pending-leaves-section').scrollIntoView()}
          >
            REVIEW NOW
          </button>
        </div>
        <div className="stat-card">
          <h3>Departments</h3>
          <p>{departmentStats?.length || 0}</p>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="card">
        <h3>📋 Today's Attendance Summary</h3>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', color: '#4caf50' }}>✅</div>
            <h4>{todayAttendance?.present || 0}</h4>
            <small>Present</small>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', color: '#ff9800' }}>⚠️</div>
            <h4>{todayAttendance?.late || 0}</h4>
            <small>Late</small>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', color: '#f44336' }}>❌</div>
            <h4>{todayAttendance?.absent || 0}</h4>
            <small>Absent</small>
          </div>
        </div>
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <small>Total Employees: {todayAttendance?.totalEmployees || 0}</small>
          <br />
          <small>Attendance Rate: {todayAttendance?.attendanceRate || 0}%</small>
        </div>
      </div>

      {/* Department Statistics */}
      {departmentStats && departmentStats.length > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>🏢 Department-wise Employee Distribution</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Department</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Employees</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {departmentStats.map((dept) => (
                <tr key={dept._id}>
                  <td style={{ padding: '10px', borderTop: '1px solid #eee' }}>{dept._id}</td>
                  <td style={{ padding: '10px', borderTop: '1px solid #eee' }}>{dept.count}</td>
                  <td style={{ padding: '10px', borderTop: '1px solid #eee' }}>
                    {totalEmployees > 0 ? ((dept.count / totalEmployees) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Employee List */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>👥 All Employees</h3>
        {employees.length === 0 ? (
          <p>No employees registered yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Department</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Position</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp._id}>
                  <td style={{ padding: '10px', borderTop: '1px solid #eee' }}>{emp.name}</td>
                  <td style={{ padding: '10px', borderTop: '1px solid #eee' }}>{emp.email}</td>
                  <td style={{ padding: '10px', borderTop: '1px solid #eee' }}>{emp.department}</td>
                  <td style={{ padding: '10px', borderTop: '1px solid #eee' }}>{emp.position}</td>
                  <td style={{ padding: '10px', borderTop: '1px solid #eee' }}>
                    <span className={`status-${emp.isActive ? 'active' : 'inactive'}`}>
                      {emp.isActive ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending Leaves Section */}
      <div className="card" id="pending-leaves-section" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <h3>📝 Leave Requests</h3>
          <div>
            <button 
              className={`btn ${selectedStatus === 'all' ? 'btn-primary' : ''}`} 
              style={{ marginRight: '5px', padding: '5px 15px', fontSize: '12px' }}
              onClick={() => handleViewAllLeaves('all')}
            >
              All
            </button>
            <button 
              className={`btn ${selectedStatus === 'pending' ? 'btn-primary' : ''}`} 
              style={{ marginRight: '5px', padding: '5px 15px', fontSize: '12px' }}
              onClick={() => handleViewAllLeaves('pending')}
            >
              Pending
            </button>
            <button 
              className={`btn ${selectedStatus === 'approved' ? 'btn-primary' : ''}`} 
              style={{ marginRight: '5px', padding: '5px 15px', fontSize: '12px' }}
              onClick={() => handleViewAllLeaves('approved')}
            >
              Approved
            </button>
            <button 
              className={`btn ${selectedStatus === 'rejected' ? 'btn-primary' : ''}`} 
              style={{ padding: '5px 15px', fontSize: '12px' }}
              onClick={() => handleViewAllLeaves('rejected')}
            >
              Rejected
            </button>
          </div>
        </div>

        {leaves.length === 0 ? (
          <p>No leave requests found</p>
        ) : (
          leaves.map((leave) => (
            <div key={leave._id} className="leave-item" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '15px',
              borderBottom: '1px solid #eee'
            }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {leave.user?.name || 'Unknown'} - {leave.type.toUpperCase()}
                  <span style={{ 
                    marginLeft: '10px',
                    color: getStatusColor(leave.status),
                    fontWeight: 'normal',
                    fontSize: '12px'
                  }}>
                    [{leave.status.toUpperCase()}]
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {leave.user?.department} | {leave.user?.employeeId}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  {' | '}{leave.totalDays} days
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Reason: {leave.reason}
                </div>
                {leave.remarks && (
                  <div style={{ fontSize: '14px', color: '#ff9800' }}>
                    Remarks: {leave.remarks}
                  </div>
                )}
              </div>
              {leave.status === 'pending' && (
                <div>
                  <button 
                    className="btn btn-success" 
                    style={{ marginRight: '10px', padding: '8px 20px' }}
                    onClick={() => handleLeaveAction(leave._id, 'approved')}
                  >
                    ✅ Approve
                  </button>
                  <button 
                    className="btn btn-danger" 
                    style={{ padding: '8px 20px' }}
                    onClick={() => handleLeaveAction(leave._id, 'rejected')}
                  >
                    ❌ Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HRDashboard;