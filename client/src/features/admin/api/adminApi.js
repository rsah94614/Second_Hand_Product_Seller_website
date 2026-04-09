import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

export const getAdminOverview = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/overview`);
  return response.data;
};

export const getAdminUsers = async (queryString = '') => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/users?${queryString}`);
  return response.data;
};

export const updateAdminUser = async (userId, payload) => {
  const response = await axios.patch(`${API_BASE_URL}/api/admin/users/${userId}`, payload);
  return response.data;
};

export const getAdminProducts = async (queryString = '') => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/products?${queryString}`);
  return response.data;
};

export const updateAdminProduct = async (productId, payload) => {
  const response = await axios.patch(`${API_BASE_URL}/api/admin/products/${productId}`, payload);
  return response.data;
};

export const deleteAdminProduct = async (productId) => {
  const response = await axios.delete(`${API_BASE_URL}/api/admin/products/${productId}`);
  return response.data;
};

export const getAdminCategories = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/categories/admin/all`);
  return response.data;
};

export const createAdminCategory = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/api/categories`, payload);
  return response.data;
};

export const updateAdminCategory = async (categoryId, payload) => {
  const response = await axios.put(`${API_BASE_URL}/api/categories/${categoryId}`, payload);
  return response.data;
};

export const deleteAdminCategory = async (categoryId) => {
  const response = await axios.delete(`${API_BASE_URL}/api/categories/${categoryId}`);
  return response.data;
};

export const getAdminOrders = async (queryString = '') => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/orders?${queryString}`);
  return response.data;
};

export const updateAdminOrder = async (orderId, payload) => {
  const response = await axios.patch(`${API_BASE_URL}/api/admin/orders/${orderId}`, payload);
  return response.data;
};

export const getAdminReports = async (queryString = '') => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/reports${queryString ? `?${queryString}` : ''}`);
  return response.data;
};

export const updateAdminReport = async (reportId, payload) => {
  const response = await axios.patch(`${API_BASE_URL}/api/admin/reports/${reportId}`, payload);
  return response.data;
};
