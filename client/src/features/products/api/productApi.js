import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

export const getProducts = (queryString = '') =>
  axios.get(`${API_BASE_URL}/api/products${queryString ? `?${queryString}` : ''}`).then((res) => res.data);

export const getProduct = (productId) =>
  axios.get(`${API_BASE_URL}/api/products/${productId}`).then((res) => res.data);

export const getRelatedProducts = (productId) =>
  axios.get(`${API_BASE_URL}/api/products/${productId}/related`).then((res) => res.data);

export const getUserProducts = (userId) =>
  axios.get(`${API_BASE_URL}/api/products/user/${userId}`).then((res) => res.data);

export const createProduct = (formData) =>
  axios.post(`${API_BASE_URL}/api/products`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then((res) => res.data);

export const updateProduct = (productId, formData) =>
  axios.put(`${API_BASE_URL}/api/products/${productId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then((res) => res.data);

export const patchProduct = (productId, payload) =>
  axios.patch(`${API_BASE_URL}/api/products/${productId}/status`, payload).then((res) => res.data);

export const deleteProduct = (productId) =>
  axios.delete(`${API_BASE_URL}/api/products/${productId}`).then((res) => res.data);

export const getProductCategories = () =>
  axios.get(`${API_BASE_URL}/api/categories`).then((res) => res.data);

export const submitProductReview = (productId, payload) =>
  axios.post(`${API_BASE_URL}/api/products/${productId}/reviews`, payload).then((res) => res.data);
