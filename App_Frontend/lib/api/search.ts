import { api } from "./client";

export const searchProducts = (params: { q: string; limit?: number }) =>
  api.get(`/api/search`, { params }).then((r) => r.data);
