import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

export const updateUserProfile = (userId, payload) =>
  axios.put(`${API_BASE_URL}/api/users/${userId}`, payload).then((res) => res.data);

export const getWishlist = () =>
  axios.get(`${API_BASE_URL}/api/users/me/wishlist`).then((res) => res.data);

export const toggleWishlist = (productId) =>
  axios.post(`${API_BASE_URL}/api/users/me/wishlist/${productId}`).then((res) => res.data);

export const getRecentlyViewed = () =>
  axios.get(`${API_BASE_URL}/api/users/me/recently-viewed`).then((res) => res.data);

export const submitSellerReview = (userId, payload) =>
  axios.post(`${API_BASE_URL}/api/users/${userId}/reviews`, payload).then((res) => res.data);
