import { api } from "./client";

export const getNotifications = (params?: { page?: number; limit?: number; unread?: boolean }) =>
  api
    .get(`/api/notifications`, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        unread: params?.unread ? "true" : "",
      },
    })
    .then((r) => r.data);

export const getUnreadNotificationCount = () =>
  api.get(`/api/notifications/unread-count`).then((r) => r.data);

export const markNotificationRead = (notificationId: string) =>
  api.patch(`/api/notifications/${notificationId}/read`).then((r) => r.data);

export const markAllNotificationsRead = () =>
  api.patch(`/api/notifications/read-all`).then((r) => r.data);
