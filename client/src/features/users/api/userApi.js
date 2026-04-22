import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

export const updateUserProfile = (userId, payload) =>
  axios.put(`${API_BASE_URL}/api/users/${userId}`, payload).then((res) => res.data);

export const getUserProfile = (userId) =>
  axios.get(`${API_BASE_URL}/api/users/${userId}`).then((res) => res.data);

export const getProfileCompletion = () =>
  axios.get(`${API_BASE_URL}/api/users/me/profile-completion`).then((res) => res.data);

export const getWishlist = () =>
  axios.get(`${API_BASE_URL}/api/users/me/wishlist`).then((res) => res.data);

export const toggleWishlist = (productId) =>
  axios.post(`${API_BASE_URL}/api/users/me/wishlist/${productId}`).then((res) => res.data);

export const getRecentlyViewed = () =>
  axios.get(`${API_BASE_URL}/api/users/me/recently-viewed`).then((res) => res.data);

export const submitSellerReview = (userId, payload) =>
  axios.post(`${API_BASE_URL}/api/users/${userId}/reviews`, payload).then((res) => res.data);

export const blockUser = (userId) =>
  axios.post(`${API_BASE_URL}/api/users/block/${userId}`).then((res) => res.data);

export const unblockUser = (userId) =>
  axios.delete(`${API_BASE_URL}/api/users/block/${userId}`).then((res) => res.data);

// ── Phase 2: Seller Verification ─────────────────────────────────────────────
export const requestSellerVerification = () =>
  axios.post(`${API_BASE_URL}/api/users/me/seller-verification`).then((res) => res.data);

export const getMySellerVerification = () =>
  axios.get(`${API_BASE_URL}/api/users/me/seller-verification`).then((res) => res.data);

// ── Phase 2: Reputation ───────────────────────────────────────────────────────
export const getMyReputation = () =>
  axios.get(`${API_BASE_URL}/api/users/me/reputation`).then((res) => res.data);

export const getUserReputation = (userId) =>
  axios.get(`${API_BASE_URL}/api/users/${userId}/reputation`).then((res) => res.data);

// ── Phase 2: Devices ──────────────────────────────────────────────────────────
export const getMyDevices = () =>
  axios.get(`${API_BASE_URL}/api/auth/devices`).then((res) => res.data);

export const removeDevice = (deviceId) =>
  axios.delete(`${API_BASE_URL}/api/auth/devices/${deviceId}`).then((res) => res.data);

export const trustDevice = (deviceId) =>
  axios.post(`${API_BASE_URL}/api/auth/devices/${deviceId}/trust`).then((res) => res.data);

// ── Avatar Upload ─────────────────────────────────────────────────────────────
export const uploadUserAvatar = (userId, formData) =>
  axios.post(`${API_BASE_URL}/api/users/${userId}/avatar`, formData).then((res) => res.data);
