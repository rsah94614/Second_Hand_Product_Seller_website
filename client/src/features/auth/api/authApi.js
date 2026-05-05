import { api, authApi } from '../../../lib/api/client';

export const getCurrentUser = () =>
  api.get('/api/auth/me').then((res) => res.data);

export const loginUser = (email, password) =>
  authApi.post('/api/auth/login', { email, password }).then((res) => res.data);

export const requestSignupOtp = (email) =>
  authApi.post('/api/auth/otp/request-signup', { email }).then((res) => res.data);

export const registerUser = (userData) =>
  authApi.post('/api/auth/register', userData).then((res) => res.data);

export const forgotPasswordApi = (email) =>
  authApi.post('/api/auth/forgot-password', { email }).then((res) => res.data);

export const resetPasswordApi = (token, newPassword) =>
  authApi.post('/api/auth/reset-password', { token, newPassword }).then((res) => res.data);

// Email verification APIs
export const verifyEmailApi = (token) =>
  api.post('/api/auth/verify-email', { token }).then((res) => res.data);

export const resendVerificationEmailApi = () =>
  api.post('/api/auth/resend-verification').then((res) => res.data);

