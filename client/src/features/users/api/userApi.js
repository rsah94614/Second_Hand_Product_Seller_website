import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

export const updateUserProfile = (userId, payload) =>
  axios.put(`${API_BASE_URL}/api/users/${userId}`, payload).then((res) => res.data);
