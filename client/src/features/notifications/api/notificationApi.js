import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

export const getNotifications = ({ page = 1, limit = 20, unread = null } = {}) => {
  const params = { page, limit };
  if (unread !== null) params.unread = unread;
  return axios.get(`${API_BASE_URL}/api/notifications`, { params }).then((res) => res.data);
};

export const getUnreadNotificationCount = () =>
  axios.get(`${API_BASE_URL}/api/notifications/unread-count`).then((res) => res.data);

export const markNotificationRead = (notificationId) =>
  axios.patch(`${API_BASE_URL}/api/notifications/${notificationId}/read`).then((res) => res.data);

export const markAllNotificationsRead = () =>
  axios.patch(`${API_BASE_URL}/api/notifications/read-all`).then((res) => res.data);

// ── Phase 2: Notification Preferences ────────────────────────────────────────
export const getNotificationPreferences = () =>
  axios.get(`${API_BASE_URL}/api/notifications/preferences`).then((res) => res.data);

export const updateNotificationPreferences = (payload) =>
  axios.put(`${API_BASE_URL}/api/notifications/preferences`, payload).then((res) => res.data);

// ── Phase 2: Notification Snooze ─────────────────────────────────────────────
export const snoozeNotification = (notificationId, duration) =>
  axios.post(`${API_BASE_URL}/api/notifications/${notificationId}/snooze`, { duration }).then((res) => res.data);

export const unsnoozeNotification = (notificationId) =>
  axios.post(`${API_BASE_URL}/api/notifications/${notificationId}/unsnooze`).then((res) => res.data);

// ── Phase 3: Grouped Notifications ───────────────────────────────────────────
export const getGroupedNotifications = () =>
  axios.get(`${API_BASE_URL}/api/notifications/grouped`).then((res) => res.data);
