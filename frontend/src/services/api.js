import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth services
export const authService = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    getProfile: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/update', data)
};

// Attendance services
export const attendanceService = {
    checkIn: (data) => api.post('/attendance/checkin', data),
    checkOut: () => api.post('/attendance/checkout'),
    getHistory: (params) => api.get('/attendance/history', { params }),
    getStatus: () => api.get('/attendance/status'),
    getSummary: (params) => api.get('/attendance/summary', { params })
};

// Leave services
export const leaveService = {
    apply: (data) => api.post('/leaves', data),
    getMyLeaves: (params) => api.get('/leaves', { params }),
    getAllLeaves: (params) => api.get('/leaves/all', { params }),
    updateStatus: (id, data) => api.put(`/leaves/${id}`, data),
    cancel: (id) => api.delete(`/leaves/${id}`)
};

// Dashboard services
export const dashboardService = {
    getHRDashboard: () => api.get('/dashboard/hr'),
    getEmployeeDashboard: () => api.get('/dashboard/employee')
};

export default api;