import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ 
  requiredRole,
  redirectPath = '/login'
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  
  console.log('ProtectedRoute check:', { 
    isAuthenticated, 
    loading, 
    hasUser: !!user,
    userDetails: user ? { name: user.name, role: user.role } : 'No user'
  });
  
  // If still loading auth state, show nothing or a spinner
  if (loading) {
    console.log('Auth state is still loading...');
    return <div className="loading">Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to={redirectPath} replace />;
  }
  
  // If role is required but user doesn't have it, redirect
  if (requiredRole && user?.role !== requiredRole) {
    console.log(`User role (${user?.role}) doesn't match required role (${requiredRole}), redirecting to unauthorized`);
    return <Navigate to="/unauthorized" replace />;
  }
  
  console.log('User authenticated and authorized, rendering protected content');
  // User is authenticated and authorized
  return <Outlet />;
};

export default ProtectedRoute; 