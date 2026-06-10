import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { updateUserProfile } from '../features/users/api/userApi';
import { authApi, api, setUnauthorizedCallback } from '../lib/api/client';
import * as storage from '../lib/auth-storage';
import { parseApiError, formatErrorForDisplay } from '../lib/errorHandler';

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
  const queryClient = useQueryClient();

  useEffect(() => {
    setUnauthorizedCallback(async () => {
      await storage.clearTokens();
      setUser(null);
      queryClient.clear();
    });

    (async () => {
      const token = await storage.getAccessToken();
      const refreshToken = await storage.getRefreshToken();

      if (token) {
        await fetchUser();
        return;
      }

      if (refreshToken) {
        try {
          const { data } = await authApi.post('/api/auth/refresh', { refreshToken });
          await storage.setTokens(data.token, data.refreshToken || refreshToken);
          await fetchUser();
        } catch {
          await storage.clearTokens();
          setUser(null);
          setLoading(false);
        }
        return;
      }

      setLoading(false);
    })();
  }, [queryClient]);

  const fetchUser = async () => {
    try {
      const response = await getCurrentUser();
      setUser(response.user);
    } catch {
      await storage.clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await loginUser(email, password);
      const { token, refreshToken, user } = response;

      await storage.setTokens(token, refreshToken || '');
      setUser(user);

      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        message: formatErrorForDisplay(parseApiError(error, 'Login failed')),
      };
    }
  };


  const register = async (userData) => {
    try {
      const response = await registerUser(userData);
      const { token, refreshToken, user } = response;

      await storage.setTokens(token, refreshToken || '');
      setUser(user);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: formatErrorForDisplay(parseApiError(error, 'Registration failed')),
      };
    }
  };

  const logout = async () => {
    const refreshToken = await storage.getRefreshToken();
    try {
      await api.post('/api/auth/logout', refreshToken ? { refreshToken } : {});
    } catch {
      // Ignore network or backend errors on logout; still clean up locally
    }
    await storage.clearTokens();
    setUser(null);
    queryClient.clear();
  };

  const forgotPassword = async (email) => {
    try {
      const response = await forgotPasswordApi(email);
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, message: formatErrorForDisplay(parseApiError(error, 'Failed to send reset link.')) };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await resetPasswordApi(token, newPassword);
      return { success: true, message: response.message };
    } catch (error) {
      return { success: false, message: formatErrorForDisplay(parseApiError(error, 'Failed to reset password.')) };
    }
  };

  const sendSignupOtp = async (email) => {
    try {
      const response = await requestSignupOtp(email);
      return { success: true, ...response };
    } catch (error) {
      return {
        success: false,
        message: formatErrorForDisplay(parseApiError(error, 'Failed to send verification code')),
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
        message: formatErrorForDisplay(parseApiError(error, 'Failed to verify email.')),
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
        message: formatErrorForDisplay(parseApiError(error, 'Failed to resend verification email.')),
      };
    }
  };

  const updateProfile = async (payload) => {
    if (!user?.id) return;
    await updateUserProfile(user.id, payload);
    await fetchUser();
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
    updateProfile,
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
