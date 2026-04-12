import { api } from "./client";

export const getConversations = () =>
  api.get(`/api/chat/conversations/all`).then((r) => r.data);

export const getConversationMessages = (userId: string) =>
  api.get(`/api/chat/${userId}`).then((r) => r.data);

export const markConversationAsRead = (userId: string) =>
  api.patch(`/api/chat/mark-read/${userId}`).then((r) => r.data);
