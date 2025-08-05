import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import api from '../services/api';

// Create context
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      // Get user profile with role-specific data
      // With HTTP-only cookies, we don't need to manually send the token
      const response = await api.get(API_ENDPOINTS.GET_USER);
      
      if (response.data.success && response.data.user) {
        // Get token from localStorage and add to user object
        const token = localStorage.getItem('token');
        const userWithToken = { ...response.data.user, token };
        setUser(userWithToken);
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      // Only log errors that are not 401 (unauthorized) as those are expected for non-authenticated users
      if (error.response?.status !== 401) {
        console.error('Error loading user:', error);
      }
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, role) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Making login request to:', API_ENDPOINTS.LOGIN);
      console.log('With credentials:', { email, role });
      
      const response = await api.post(API_ENDPOINTS.LOGIN, { email, password, role });
      console.log('Login response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }

      const { user, token } = response.data;
      
      if (!user || !token) {
        throw new Error('Invalid response format from server');
      }
      
      // Store the token for future requests
      localStorage.setItem('token', token);
      
      // Add token to user object for API calls
      const userWithToken = { ...user, token };
      setUser(userWithToken);
      setIsAuthenticated(true);
      return userWithToken;
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(API_ENDPOINTS.REGISTER, userData);
      
      if (response.data.success) {
        console.log('Registration successful:', response.data);
        return true;
      } else {
        throw new Error(response.data.message || 'Registration failed.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call the logout endpoint to clear the cookie on the server
      await api.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Remove token from storage
      localStorage.removeItem('token');
      // Clear local state regardless of API call success
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(API_ENDPOINTS.UPDATE_PROFILE, profileData);
      
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        return response.data.user;
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      isAuthenticated,
      login,
      register,
      logout,
      updateProfile,
      setError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;