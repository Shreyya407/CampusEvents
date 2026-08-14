import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/database.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-body-sm font-label-md text-on-surface-variant">Loading application state...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to appropriate login page based on target URL
    const isAdminRoute = location.pathname.startsWith('/admin');
    return <Navigate to={isAdminRoute ? '/admin/login' : '/login'} state={{ from: location }} replace />;
  }

  if (allowedRole && profile?.role !== allowedRole) {
    // Unauthorized role access
    if (allowedRole === 'admin') {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/events" replace />;
  }

  return <>{children}</>;
};
