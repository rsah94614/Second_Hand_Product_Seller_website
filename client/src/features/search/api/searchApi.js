import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

/**
 * Global search — returns matching products and users.
 * @param {string} q - Search query (min 2 chars)
 * @param {number} limit - Max results per type (default 5, max 10)
 */
export const globalSearch = (q, limit = 5) =>
  axios
    .get(`${API_BASE_URL}/api/search`, { params: { q, limit } })
    .then((res) => res.data);
