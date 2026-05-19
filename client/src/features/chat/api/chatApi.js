import { api } from '../../../lib/api/client';

export const getConversations = () =>
  api.get('/api/chat/conversations/all').then((res) => res.data);

export const getConversationMessages = (userId, before, limit = 50) =>
  api.get(`/api/chat/${userId}`, { params: { limit, ...(before && { before }) } }).then((res) => res.data);

export const markConversationAsRead = (userId) =>
  api.patch(`/api/chat/mark-read/${userId}`).then((res) => res.data);

export const reportChatUser = (userId, payload) =>
  api.post(`/api/chat/report/${userId}`, payload).then((res) => res.data);

// ── Phase 3: Message Search ───────────────────────────────────────────────────
export const searchMessages = (q, userId = null) =>
  api.get('/api/chat/search', { params: { q, ...(userId && { userId }) } }).then((res) => res.data);

// ── Phase 3: Conversation Pinning ─────────────────────────────────────────────
export const pinConversation = (userId) =>
  api.post(`/api/chat/pin/${userId}`).then((res) => res.data);

export const unpinConversation = (userId) =>
  api.delete(`/api/chat/pin/${userId}`).then((res) => res.data);

// ── Phase 3: Image Sharing ────────────────────────────────────────────────────
export const uploadChatImage = (formData) =>
  api.post('/api/chat/upload-image', formData).then((res) => res.data);
