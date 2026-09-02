import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import EmployeeDashboard from './components/dashboard/EmployeeDashboard';
import HRDashboard from './components/dashboard/HRDashboard';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        success: {
            main: '#2e7d32',
        },
        warning: {
            main: '#ed6c02',
        },
    },
});

const AppContent = () => {
    const { isAuthenticated, user } = useAuth();

    return (
        <Router>
            {isAuthenticated && <Navbar />}
            <div style={{ padding: isAuthenticated ? '20px' : '0' }}>
                <Routes>
                    <Route path="/login" element={
                        isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
                    } />
                    <Route path="/register" element={
                        isAuthenticated ? <Navigate to="/dashboard" /> : <Register />
                    } />
                    
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            {user?.role === 'hr' ? <HRDashboard /> : <EmployeeDashboard />}
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/" element={
                        <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
                    } />
                    <Route path="*" element={
                        <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
                    } />
                </Routes>
            </div>
        </Router>
    );
};

function App() {
    return (
        <ThemeProvider theme={theme}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;