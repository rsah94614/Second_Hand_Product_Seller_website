import { api } from "./client";

export const updateUserProfile = (userId: string, payload: Record<string, unknown>) =>
  api.put(`/api/users/${userId}`, payload).then((r) => r.data);

export const getWishlist = () => api.get(`/api/users/me/wishlist`).then((r) => r.data);

export const toggleWishlist = (productId: string) =>
  api.post(`/api/users/me/wishlist/${productId}`).then((r) => r.data);

export const getRecentlyViewed = () =>
  api.get(`/api/users/me/recently-viewed`).then((r) => r.data);

export const submitSellerReview = (userId: string, payload: { rating: number; comment: string; productId?: string }) =>
  api.post(`/api/users/${userId}/reviews`, payload).then((r) => r.data);
