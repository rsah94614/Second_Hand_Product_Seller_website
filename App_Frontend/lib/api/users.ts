import { api, uploadFormData } from "./client";

export const updateUserProfile = (userId: string, payload: Record<string, unknown>) =>
  api.put(`/api/users/${userId}`, payload).then((r) => r.data);

export const getUserProfile = (userId: string) =>
  api.get(`/api/users/${userId}`).then((r) => r.data);

export const uploadUserAvatar = (userId: string, payload: FormData) =>
  uploadFormData(`/api/users/${userId}/avatar`, payload);

export const getWishlist = () => api.get(`/api/users/me/wishlist`).then((r) => r.data);

export const toggleWishlist = (productId: string) =>
  api.post(`/api/users/me/wishlist/${productId}`).then((r) => r.data);

export const getRecentlyViewed = () =>
  api.get(`/api/users/me/recently-viewed`).then((r) => r.data);

export const getBlockedUsers = () =>
  api.get(`/api/users/me/blocked`).then((r) => r.data);

export const submitSellerReview = (
  userId: string,
  payload: { rating: number; comment: string; orderId?: string; productId?: string }
) =>
  api.post(`/api/users/${userId}/reviews`, payload).then((r) => r.data);

export const blockUser = (userId: string) =>
  api.post(`/api/users/block/${userId}`).then((r) => r.data);

export const unblockUser = (userId: string) =>
  api.delete(`/api/users/block/${userId}`).then((r) => r.data);

// ── Phase 2: Seller Verification ─────────────────────────────────────────────
export const requestSellerVerification = () =>
  api.post(`/api/users/me/seller-verification`).then((r) => r.data);

export const getMySellerVerification = () =>
  api.get(`/api/users/me/seller-verification`).then((r) => r.data);

// ── Phase 2: Reputation ───────────────────────────────────────────────────────
export const getMyReputation = () =>
  api.get(`/api/users/me/reputation`).then((r) => r.data);

export const getUserReputation = (userId: string) =>
  api.get(`/api/users/${userId}/reputation`).then((r) => r.data);

// ── Phase 2: Devices ──────────────────────────────────────────────────────────
export const getMyDevices = () =>
  api.get(`/api/auth/devices`).then((r) => r.data);

export const removeDevice = (deviceId: string) =>
  api.delete(`/api/auth/devices/${deviceId}`).then((r) => r.data);

export const trustDevice = (deviceId: string) =>
  api.post(`/api/auth/devices/${deviceId}/trust`).then((r) => r.data);

// ── Profile Completion ────────────────────────────────────────────────────────
export const getProfileCompletion = () =>
  api.get(`/api/users/me/profile-completion`).then((r) => r.data);
