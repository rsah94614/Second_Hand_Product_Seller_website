import { api } from "./client";

export const getConversations = () =>
  api.get(`/api/chat/conversations/all`).then((r) => r.data);

export const getConversationMessages = (userId: string) =>
  api.get(`/api/chat/${userId}`).then((r) => r.data);

export const markConversationAsRead = (userId: string) =>
  api.patch(`/api/chat/mark-read/${userId}`).then((r) => r.data);

export const getChatTemplates = () =>
  api.get(`/api/chat/templates`).then((r) => r.data);

export type ReportChatPayload = {
  reason: string;
  details?: string;
  messageId?: string | null;
  productId?: string | null;
};

export const reportChatUser = (userId: string, payload: ReportChatPayload) =>
  api.post(`/api/chat/report/${userId}`, payload).then((r) => r.data);

// ── Phase 3: Message Search ───────────────────────────────────────────────────
export const searchMessages = (q: string, userId?: string) =>
  api.get(`/api/chat/search`, { params: { q, ...(userId && { userId }) } }).then((r) => r.data);

// ── Phase 3: Conversation Pinning ─────────────────────────────────────────────
export const pinConversation = (userId: string) =>
  api.post(`/api/chat/pin/${userId}`).then((r) => r.data);

export const unpinConversation = (userId: string) =>
  api.delete(`/api/chat/pin/${userId}`).then((r) => r.data);

// ── Phase 3: Image Sharing ────────────────────────────────────────────────────
export const uploadChatImage = (formData: FormData) =>
  api.post(`/api/chat/upload-image`, formData).then((r) => r.data);
