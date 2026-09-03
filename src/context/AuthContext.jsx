import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { setCacheBypass, invalidateCache } from '../utils/cache';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // Admins edit the catalogue, so they must always read live data rather than
  // the shared response cache. Keep the cache layer in step with who is signed in.
  useEffect(() => {
    setCacheBypass(user?.role === 'admin');
  }, [user]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.data);
      } catch (error) {
        // Covers an expired token and a revoked one (the backend rejects tokens
        // issued before the last password change or logout-everywhere).
        localStorage.removeItem('token');
        setUser(null);
        invalidateCache();
      }
    }
    setLoading(false);
  };

  // Login via email + password
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, ...userData } = response.data.data;
      localStorage.setItem('token', token);
      setUser(userData);
      toast.success(`Welcome back, ${userData.name || 'User'}! 🎉`);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Login via OTP — token + user data come directly from OTP verify response
  const loginWithData = (data) => {
    const { token, ...userData } = data;
    localStorage.setItem('token', token);
    setUser(userData);
    toast.success(`Welcome, ${userData.name || 'User'}! 🎉`);
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    // Tell the backend first so it bumps tokenVersion and the token is actually
    // revoked server-side. Without this call a copy of the token kept working
    // until it expired, even though the user had "logged out".
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // An expired or already-invalid token still means the user is logged out.
      // Never block the local sign-out on a network or auth failure.
      console.warn('Server logout failed; clearing local session anyway.', err?.message);
    }

    localStorage.removeItem('token');
    setUser(null);
    // Drop every cached response so the next session never inherits this one's data.
    invalidateCache();
    toast.success('Logged out successfully. See you soon!');
  };

  const updateProfile = async (data) => {
    try {
      const response = await api.put('/auth/profile', data);
      setUser(response.data.data);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Update failed' 
      };
    }
  };

  const changeEmail = async (newEmail, password) => {
    try {
      const response = await api.put('/auth/change-email', { newEmail, password });
      setUser(response.data.data);
      return { 
        success: true, 
        message: response.data.message || 'Email updated successfully' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Email change failed' 
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/auth/change-password', { currentPassword, newPassword });
      // Update token if new one is provided
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return { 
        success: true, 
        message: response.data.message || 'Password updated successfully' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Password change failed' 
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    loginWithData,
    register,
    logout,
    updateProfile,
    changeEmail,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
