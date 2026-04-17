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
