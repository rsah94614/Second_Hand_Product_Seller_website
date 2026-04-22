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

// ── Phase 3: Message Search ───────────────────────────────────────────────────
export const searchMessages = (q, userId = null) =>
  axios.get(`${API_BASE_URL}/api/chat/search`, { params: { q, ...(userId && { userId }) } }).then((res) => res.data);

// ── Phase 3: Conversation Pinning ─────────────────────────────────────────────
export const pinConversation = (userId) =>
  axios.post(`${API_BASE_URL}/api/chat/pin/${userId}`).then((res) => res.data);

export const unpinConversation = (userId) =>
  axios.delete(`${API_BASE_URL}/api/chat/pin/${userId}`).then((res) => res.data);

// ── Phase 3: Image Sharing ────────────────────────────────────────────────────
export const uploadChatImage = (formData) =>
  axios.post(`${API_BASE_URL}/api/chat/upload-image`, formData).then((res) => res.data);
