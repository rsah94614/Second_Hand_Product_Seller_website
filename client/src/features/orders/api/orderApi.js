import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

export const getOrders = () =>
  axios.get(`${API_BASE_URL}/api/orders`).then((res) => res.data);

export const placeOrder = (payload) =>
  axios.post(`${API_BASE_URL}/api/orders`, payload).then((res) => res.data);

export const cancelOrder = (orderId) =>
  axios.patch(`${API_BASE_URL}/api/orders/${orderId}/cancel`).then((res) => res.data);
