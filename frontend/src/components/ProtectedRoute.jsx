import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const normalizedUserRole = user?.role?.toLowerCase?.().trim?.() || '';
  const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase().trim());

  if (!user) return <Navigate to="/login" />;
  if (!normalizedAllowedRoles.includes(normalizedUserRole)) return <Navigate to="/unauthorized" />;

  return children;
};

export default ProtectedRoute;
