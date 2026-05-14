import { api } from '../../../lib/api/client';

export const updateUserProfile = (userId, payload) =>
  api.put(`/api/users/${userId}`, payload).then((res) => res.data);

export const getUserProfile = (userId) =>
  api.get(`/api/users/${userId}`).then((res) => res.data);

export const getProfileCompletion = () =>
  api.get('/api/users/me/profile-completion').then((res) => res.data);

export const getWishlist = () =>
  api.get('/api/users/me/wishlist').then((res) => res.data);

export const toggleWishlist = (productId) =>
  api.post(`/api/users/me/wishlist/${productId}`).then((res) => res.data);

export const getRecentlyViewed = () =>
  api.get('/api/users/me/recently-viewed').then((res) => res.data);

export const submitSellerReview = (userId, payload) =>
  api.post(`/api/users/${userId}/reviews`, payload).then((res) => res.data);

export const blockUser = (userId) =>
  api.post(`/api/users/block/${userId}`).then((res) => res.data);

export const unblockUser = (userId) =>
  api.delete(`/api/users/block/${userId}`).then((res) => res.data);

// ── Phase 2: Seller Verification ─────────────────────────────────────────────
export const requestSellerVerification = () =>
  api.post('/api/users/me/seller-verification').then((res) => res.data);

export const getMySellerVerification = () =>
  api.get('/api/users/me/seller-verification').then((res) => res.data);

// ── Phase 2: Reputation ───────────────────────────────────────────────────────
export const getMyReputation = () =>
  api.get('/api/users/me/reputation').then((res) => res.data);

export const getUserReputation = (userId) =>
  api.get(`/api/users/${userId}/reputation`).then((res) => res.data);

// ── Phase 2: Devices ──────────────────────────────────────────────────────────
export const getMyDevices = () =>
  api.get('/api/auth/devices').then((res) => res.data);

export const removeDevice = (deviceId) =>
  api.delete(`/api/auth/devices/${deviceId}`).then((res) => res.data);

export const trustDevice = (deviceId) =>
  api.post(`/api/auth/devices/${deviceId}/trust`).then((res) => res.data);

export const getBlockedUsers = () =>
  api.get('/api/users/me/blocked').then((res) => res.data.blocked);

export const deleteAccount = () =>
  api.delete('/api/users/me').then((res) => res.data);

// ── Avatar Upload ─────────────────────────────────────────────────────────────
export const uploadUserAvatar = (userId, formData) =>
  api.post(`/api/users/${userId}/avatar`, formData).then((res) => res.data);
