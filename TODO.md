# TODO List for Employee Workload Management System Setup

## Backend Setup
- [x] Create backend/package.json with dependencies (Express, Sequelize, bcrypt, jsonwebtoken, etc.)
- [x] Create backend/.env with environment variables
- [x] Create backend/server.js with Express app setup
- [x] Create backend/config/db.js for database configuration
- [x] Create backend/models/index.js for Sequelize setup
- [x] Create backend/models/User.js for User model
- [x] Create backend/models/Task.js for Task model
- [x] Create backend/migrations/create-user.js for user table migration
- [x] Create backend/migrations/create-task.js for task table migration
- [ ] Create backend/middleware/auth.js for JWT authentication
- [x] Create backend/middleware/authorize.js for role-based authorization
- [x] Create backend/controllers/authController.js for login/register
- [ ] Create backend/controllers/userController.js for user CRUD
- [ ] Create backend/controllers/taskController.js for task CRUD
- [ ] Create backend/routes/authRoutes.js for auth endpoints
- [ ] Create backend/routes/userRoutes.js for user endpoints
- [ ] Create backend/routes/taskRoutes.js for task endpoints
- [ ] Create backend/services/workloadService.js for workload calculations

## Frontend Setup
- [ ] Create frontend/package.json with dependencies (React, Vite, Axios, React Router, etc.)
- [ ] Create frontend/.env with environment variables
- [ ] Create frontend/vite.config.js for Vite configuration
- [ ] Create frontend/src/main.jsx as entry point
- [ ] Create frontend/src/App.jsx with routing
- [ ] Create frontend/src/index.css for global styles
- [ ] Create frontend/src/api/axiosInstance.js for API client
- [ ] Create frontend/src/components/Header.jsx
- [ ] Create frontend/src/components/Footer.jsx
- [ ] Create frontend/src/components/Sidebar.jsx
- [ ] Create frontend/src/components/ProtectedRoute.jsx
- [ ] Create frontend/src/pages/Login.jsx
- [ ] Create frontend/src/pages/AdminDashboard.jsx
- [ ] Create frontend/src/pages/ManagerDashboard.jsx
- [ ] Create frontend/src/pages/EmployeeDashboard.jsx
- [ ] Create frontend/src/pages/Unauthorized.jsx
- [ ] Create frontend/src/utils/auth.js for auth utilities

## Followup Steps
- [ ] Run npm install in backend/ and frontend/
- [ ] Test backend server and frontend dev server
- [ ] Run database migrations
- [ ] Verify basic functionality
