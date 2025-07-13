import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Component that only renders its children if the user has the required role
export const RoleRequired = ({ roles, children, redirectTo = '/unauthorized' }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (!roles.includes(user.role)) {
    return <Navigate to={redirectTo} />;
  }
  
  return children;
};

// Hook to check if user has specific role
export const useHasRole = (roles) => {
  const { user } = useAuth();
  
  if (!user) return false;
  
  return roles.includes(user.role);
};

// Function to check if route should be accessible based on role
export const checkRoleAccess = (user, requiredRoles) => {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}; 