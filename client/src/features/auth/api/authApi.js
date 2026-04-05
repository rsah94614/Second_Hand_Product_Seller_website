import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

export const getCurrentUser = () =>
  axios.get(`${API_BASE_URL}/api/auth/me`).then((res) => res.data);

export const loginUser = (email, password) =>
  axios.post(`${API_BASE_URL}/api/auth/login`, { email, password }).then((res) => res.data);

export const registerUser = (userData) =>
  axios.post(`${API_BASE_URL}/api/auth/register`, userData).then((res) => res.data);

export const forgotPasswordApi = (email) =>
  axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email }).then((res) => res.data);

export const resetPasswordApi = (token, newPassword) =>
  axios.post(`${API_BASE_URL}/api/auth/reset-password`, { token, newPassword }).then((res) => res.data);
