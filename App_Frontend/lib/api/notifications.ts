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

// ── Phase 2: Notification Preferences ────────────────────────────────────────
export const getNotificationPreferences = () =>
  api.get(`/api/notifications/preferences`).then((r) => r.data);

export const updateNotificationPreferences = (payload: Record<string, boolean>) =>
  api.put(`/api/notifications/preferences`, payload).then((r) => r.data);

// ── Phase 2: Notification Snooze ─────────────────────────────────────────────
export const snoozeNotification = (notificationId: string, duration: "1h" | "1d" | "1w") =>
  api.post(`/api/notifications/${notificationId}/snooze`, { duration }).then((r) => r.data);

export const unsnoozeNotification = (notificationId: string) =>
  api.post(`/api/notifications/${notificationId}/unsnooze`).then((r) => r.data);

// ── Phase 3: Grouped Notifications ───────────────────────────────────────────
export const getGroupedNotifications = () =>
  api.get(`/api/notifications/grouped`).then((r) => r.data);
