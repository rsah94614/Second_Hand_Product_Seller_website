import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

/**
 * Global search — returns matching products and users.
 * Phase 4: uses MongoDB text index for relevance sort
 */
export const globalSearch = (q, { limit = 5, sort = 'relevance', order = 'desc', cursor = null } = {}) =>
  axios
    .get(`${API_BASE_URL}/api/search`, { params: { q, limit, sort, order, ...(cursor && { cursor }) } })
    .then((res) => res.data);

// ── Phase 3: Search History ───────────────────────────────────────────────────
export const getSearchHistory = () =>
  axios.get(`${API_BASE_URL}/api/search/history`).then((res) => res.data);

export const clearSearchHistory = () =>
  axios.delete(`${API_BASE_URL}/api/search/history`).then((res) => res.data);

// ── Phase 3: Search Suggestions ──────────────────────────────────────────────
export const getSearchSuggestions = (q) =>
  axios.get(`${API_BASE_URL}/api/search/suggestions`, { params: { q } }).then((res) => res.data);
