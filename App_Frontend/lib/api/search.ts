import { api } from "./client";

export const searchProducts = (params: {
  q: string;
  limit?: number;
  sort?: string;
  order?: string;
  cursor?: string;
}) => api.get(`/api/search`, { params }).then((r) => r.data);

// ── Phase 3: Search History ───────────────────────────────────────────────────
export const getSearchHistory = () =>
  api.get(`/api/search/history`).then((r) => r.data);

export const clearSearchHistory = () =>
  api.delete(`/api/search/history`).then((r) => r.data);

// ── Phase 3: Search Suggestions ──────────────────────────────────────────────
export const getSearchSuggestions = (q: string) =>
  api.get(`/api/search/suggestions`, { params: { q } }).then((r) => r.data);
