import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isStaffOrAdmin, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner message="Verifying authentication session..." />;
  }

  if (!isAuthenticated) {
    // Preserve the attempted path to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isStaffOrAdmin) {
    // If not staff/admin, redirect to personal dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
