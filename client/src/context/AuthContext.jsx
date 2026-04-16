import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import {
  getCurrentUser,
  loginUser,
  requestLoginOtp,
  registerUser,
  requestPhoneVerificationOtp,
  forgotPasswordApi,
  resetPasswordApi,
  verifyLoginOtp,
  verifyPhoneOtp,
} from '../features/auth/api/authApi';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await getCurrentUser();
      setUser(response.user);
    } catch {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await loginUser(email, password);
      const { token, user } = response;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const loginWithOtp = async (phone, otp) => {
    try {
      const response = await verifyLoginOtp(phone, otp);
      const { token, user } = response;

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);

      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'OTP login failed',
      };
    }
  };

  const sendLoginOtp = async (phone) => {
    try {
      const response = await requestLoginOtp(phone);
      return { success: true, ...response };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await registerUser(userData);
      const { token, user } = response;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const forgotPassword = async (email) => {
    try {
      const response = await forgotPasswordApi(email);
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to send reset link.' };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await resetPasswordApi(token, newPassword);
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to reset password.' };
    }
  };

  const sendPhoneVerificationOtp = async () => {
    try {
      const response = await requestPhoneVerificationOtp();
      return { success: true, ...response };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send phone verification OTP.',
      };
    }
  };

  const confirmPhoneVerificationOtp = async (otp) => {
    try {
      const response = await verifyPhoneOtp(otp);
      await fetchUser();
      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify phone OTP.',
      };
    }
  };

  const value = {
    user,
    login,
    loginWithOtp,
    sendLoginOtp,
    register,
    logout,
    forgotPassword,
    resetPassword,
    sendPhoneVerificationOtp,
    confirmPhoneVerificationOtp,
    loading,
    refreshUser: fetchUser,
    isUser: user?.role === 'user',
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
