import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import {
  getCurrentUser,
  loginUser,
  registerUser,
  requestSignupOtp,
  forgotPasswordApi,
  resetPasswordApi,
  verifyEmailApi,
  resendVerificationEmailApi,
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

  const logout = async () => {
    try {
      // Call backend to invalidate token(s)
      await axios.post(`${API_BASE_URL}/api/auth/logout`);
    } catch {
      // Ignore network or backend errors on logout; still clean up locally
    }
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

  const sendSignupOtp = async (email) => {
    try {
      const response = await requestSignupOtp(email);
      return { success: true, ...response };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send verification code',
      };
    }
  };

  const verifyEmail = async (token) => {
    try {
      const response = await verifyEmailApi(token);
      await fetchUser();
      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify email.',
      };
    }
  };

  const resendVerificationEmail = async () => {
    try {
      const response = await resendVerificationEmailApi();
      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to resend verification email.',
      };
    }
  };

  const value = {
    user,
    login,
    register,
    sendSignupOtp,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
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
