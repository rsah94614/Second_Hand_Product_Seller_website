import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

export const getNotifications = ({ page = 1, limit = 20, unread = null } = {}) => {
  const params = { page, limit };
  if (unread !== null) {
    params.unread = unread;
  }
  return axios
    .get(`${API_BASE_URL}/api/notifications`, { params })
    .then((res) => res.data);
};

export const getUnreadNotificationCount = () =>
  axios.get(`${API_BASE_URL}/api/notifications/unread-count`).then((res) => res.data);

export const markNotificationRead = (notificationId) =>
  axios.patch(`${API_BASE_URL}/api/notifications/${notificationId}/read`).then((res) => res.data);

export const markAllNotificationsRead = () =>
  axios.patch(`${API_BASE_URL}/api/notifications/read-all`).then((res) => res.data);
