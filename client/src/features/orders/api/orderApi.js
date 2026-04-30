import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

export const getOrders = () =>
  axios.get(`${API_BASE_URL}/api/orders`).then((res) => res.data);

export const placeOrder = (payload) =>
  axios.post(`${API_BASE_URL}/api/orders`, payload).then((res) => res.data);

export const cancelOrder = (orderId) =>
  axios.patch(`${API_BASE_URL}/api/orders/${orderId}/cancel`).then((res) => res.data);

export const acceptOrder = (orderId) =>
  axios.patch(`${API_BASE_URL}/api/orders/${orderId}/accept`).then((res) => res.data);

export const scheduleMeetup = (orderId, payload) =>
  axios.patch(`${API_BASE_URL}/api/orders/${orderId}/meetup`, payload).then((res) => res.data);

export const completeOrder = (orderId) =>
  axios.patch(`${API_BASE_URL}/api/orders/${orderId}/complete`).then((res) => res.data);

export const reportNoShow = (orderId, payload = { noShowBy: 'seller' }) =>
  axios.patch(`${API_BASE_URL}/api/orders/${orderId}/no-show`, payload).then((res) => res.data);

// ── Phase 2: Confirmation Photo ───────────────────────────────────────────────
export const uploadConfirmationPhoto = (orderId, formData) =>
  axios.post(`${API_BASE_URL}/api/orders/${orderId}/confirmation-photo`, formData).then((res) => res.data);

// ── Phase 2: Disputes ─────────────────────────────────────────────────────────
export const createDispute = (orderId, formData) =>
  axios.post(`${API_BASE_URL}/api/orders/${orderId}/dispute`, formData).then((res) => res.data);

export const getDisputes = () =>
  axios.get(`${API_BASE_URL}/api/orders/disputes/all`).then((res) => res.data);
