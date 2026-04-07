import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './utils/auth';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminRolesPage from './pages/AdminRolesPage';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerEmployeesPage from './pages/ManagerEmployeesPage';
import ManagerCreateTaskPage from './pages/ManagerCreateTaskPage';
import ManagerAvailableTasksPage from './pages/ManagerAvailableTasksPage';
import ManagerTaskAssignmentPage from './pages/ManagerTaskAssignmentPage';
import ManagerTaskHoldersPage from './pages/ManagerTaskHoldersPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeTasksPage from './pages/EmployeeTasksPage';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminRolesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/employees"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerEmployeesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/create-task"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerCreateTaskPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/available-tasks"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerAvailableTasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/assign-task"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerTaskAssignmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/task-holders"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerTaskHoldersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/tasks"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <EmployeeTasksPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/unauthorized" replace />} />
      </Routes>

      {/* Global Toast Notifications */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '8px',
            fontSize: '14px',
          },
        }}
      />
    </>
  );
}

export default App;
