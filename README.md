# Employee Attendance Management System

A comprehensive Employee Attendance Management System built with the MERN stack (MongoDB, Express.js, React.js, Node.js). This system provides complete attendance tracking, leave management, and role-based dashboards for HR and Employees.

---

## ✨ Features

### Core Features
- ✅ **Employee Login & Registration** - Secure JWT-based authentication
- ✅ **Attendance Check-In / Check-Out** - Real-time attendance tracking
- ✅ **Working Hours Calculation** - Automatic calculation of daily working hours
- ✅ **Leave Deduction Calculation** - Track total, used, and available leaves
- ✅ **HR Dashboard** - Complete organizational overview
- ✅ **Employee Dashboard** - Personal attendance and leave management
- ✅ **Attendance Status Tracking** - Present, Late, Absent status tracking

### Additional Features
- ✅ **Role-based Access Control** - Separate views for HR and Employees
- ✅ **Department Analytics** - Department-wise employee distribution
- ✅ **Leave Management** - Apply, view history, cancel leave
- ✅ **Weekly Attendance** - Visual weekly attendance tracker
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Modern UI** - Material-UI components with professional design

---

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI Framework
- **Material-UI v5** - Component Library
- **Axios** - HTTP Client
- **React Router DOM** - Navigation
- **Context API** - State Management

### Backend
- **Node.js** - Runtime Environment
- **Express.js** - Web Framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password Hashing
- **express-validator** - Input Validation

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Step 1: Clone the Repository

```bash
git clone https://github.com/Saumyajit23/employee-attendance-system.git
cd employee-attendance-system
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
# For Windows:
copy .env.example .env
# For Mac/Linux:
cp .env.example .env

# Update .env with your configuration
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/attendance_system
# JWT_SECRET=your_super_secret_key_here
# JWT_EXPIRE=7d

# Start backend server
npm run dev
```

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create .env file
# For Windows:
copy .env.example .env
# For Mac/Linux:
cp .env.example .env

# Update .env with your configuration
# REACT_APP_API_URL=http://localhost:5000/api

# Start frontend server
npm start
```

### Step 4: Start MongoDB

```bash
# Start MongoDB service
mongod --dbpath C:\data\db

# OR if MongoDB is installed as a service
net start MongoDB
```

### Step 5: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Test API:** http://localhost:5000/api/test

---

## 🔑 Default Admin Account

```
Email:    admin@company.com
Password: admin123
Role:     HR Administrator
```

> ⚠️ **Security Notice:** This is a default seeded account for development and testing purposes only. Change the password immediately if deploying to any shared or production environment.

---

## 📁 Project Structure

```
employee-attendance-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Attendance.js
│   │   │   └── Leave.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── attendanceController.js
│   │   │   ├── leaveController.js
│   │   │   └── dashboardController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── attendanceRoutes.js
│   │   │   ├── leaveRoutes.js
│   │   │   └── dashboardRoutes.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── app.js
│   ├── server.js
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   ├── Login.jsx
    │   │   │   └── Register.jsx
    │   │   ├── dashboard/
    │   │   │   ├── EmployeeDashboard.jsx
    │   │   │   └── HRDashboard.jsx
    │   │   └── common/
    │   │       ├── Navbar.jsx
    │   │       └── ProtectedRoute.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   └── index.js
    ├── public/
    ├── package.json
    └── .env
```

---

## 🔧 Environment Variables

### Backend `.env`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/attendance_system
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
```

### Frontend `.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📊 API Documentation

### Authentication Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/update` | Update profile |

### Attendance Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance/checkin` | Check in |
| POST | `/api/attendance/checkout` | Check out |
| GET | `/api/attendance/history` | Get attendance history |
| GET | `/api/attendance/status` | Get today's status |
| GET | `/api/attendance/summary` | Get summary (HR only) |

### Leave Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/leaves` | Apply for leave |
| GET | `/api/leaves` | Get user's leaves |
| GET | `/api/leaves/all` | Get all leaves (HR only) |
| PUT | `/api/leaves/:id` | Update leave status (HR only) |
| DELETE | `/api/leaves/:id` | Cancel leave |

### Dashboard Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/hr` | HR dashboard data |
| GET | `/api/dashboard/employee` | Employee dashboard data |

---

## 🧪 Testing

### Test Backend API

```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test User","employeeId":"EMP001","department":"Engineering","position":"Developer"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Test API health
curl http://localhost:5000/api/test
```

---

## 📝 Troubleshooting

### MongoDB Connection Error

```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB
mongod --dbpath C:\data\db

# Or if installed as a service
net start MongoDB
```

### Port Already in Use

```bash
# Find process using port 5000
netstat -ano | findstr :5000
# Kill process
taskkill /PID <PID> /F

# Find process using port 3000
netstat -ano | findstr :3000
# Kill process
taskkill /PID <PID> /F
```

### NPM Install Errors

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json
npm install

# Install with legacy peer deps
npm install --legacy-peer-deps
```

---

## 🛡️ Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT authentication with expiration
- ✅ Protected routes
- ✅ Input validation
- ✅ CORS protection
- ✅ Helmet.js for security headers
- ✅ Role-based access control

---

## 📈 Future Enhancements

- [ ] Email notifications for leave approval/rejection
- [ ] Export reports to Excel/PDF
- [ ] Profile picture upload
- [ ] Real-time notifications with WebSockets
- [ ] Mobile application
- [ ] Biometric attendance integration

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.