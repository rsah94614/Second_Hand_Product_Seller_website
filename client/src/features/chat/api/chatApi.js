import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

export const getConversations = () =>
  axios.get(`${API_BASE_URL}/api/chat/conversations/all`).then((res) => res.data);

export const getConversationMessages = (userId) =>
  axios.get(`${API_BASE_URL}/api/chat/${userId}`).then((res) => res.data);

export const markConversationAsRead = (userId) =>
  axios.patch(`${API_BASE_URL}/api/chat/mark-read/${userId}`).then((res) => res.data);

export const reportChatUser = (userId, payload) =>
  axios.post(`${API_BASE_URL}/api/chat/report/${userId}`, payload).then((res) => res.data);
