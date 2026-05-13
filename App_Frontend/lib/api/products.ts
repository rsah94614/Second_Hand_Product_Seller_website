import { api, uploadFormData } from "./client";

export const getProducts = (queryString = "") =>
  api.get(`/api/products${queryString ? `?${queryString}` : ""}`).then((r) => r.data);

export const getProduct = (productId: string) =>
  api.get(`/api/products/${productId}`).then((r) => r.data);

export const getRelatedProducts = (productId: string) =>
  api.get(`/api/products/${productId}/related`).then((r) => r.data);

export const getUserProducts = (userId: string) =>
  api.get(`/api/products/user/${userId}`).then((r) => r.data);

export const createProduct = (formData: FormData) =>
  uploadFormData(`/api/products`, formData);

export const updateProduct = (productId: string, formData: FormData) =>
  uploadFormData(`/api/products/${productId}`, formData, "PUT");

export const patchProduct = (productId: string, payload: Record<string, unknown>) =>
  api.patch(`/api/products/${productId}/status`, payload).then((r) => r.data);

export const deleteProduct = (productId: string) =>
  api.delete(`/api/products/${productId}`).then((r) => r.data);

export const getProductCategories = () => api.get(`/api/categories`).then((r) => r.data);

export const reportProduct = (productId: string, payload: Record<string, unknown>) =>
  api.post(`/api/products/${productId}/report`, payload).then((r) => r.data);

// ── Phase 2: Relist ───────────────────────────────────────────────────────────
export const relistProduct = (productId: string) =>
  api.post(`/api/products/${productId}/relist`).then((r) => r.data);

// ── Phase 3: Product Analytics ────────────────────────────────────────────────
export const getProductAnalytics = (productId: string) =>
  api.get(`/api/products/${productId}/analytics`).then((r) => r.data);

export const getSellerAnalyticsSummary = () =>
  api.get(`/api/products/analytics/summary`).then((r) => r.data);
