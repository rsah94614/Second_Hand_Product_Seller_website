import { api } from "./client";

export const getProducts = (queryString = "") =>
  api.get(`/api/products${queryString ? `?${queryString}` : ""}`).then((r) => r.data);

export const getProduct = (productId: string) =>
  api.get(`/api/products/${productId}`).then((r) => r.data);

export const getRelatedProducts = (productId: string) =>
  api.get(`/api/products/${productId}/related`).then((r) => r.data);

export const getUserProducts = (userId: string) =>
  api.get(`/api/products/user/${userId}`).then((r) => r.data);

export const createProduct = (formData: FormData) =>
  api.post(`/api/products`, formData).then((r) => r.data);

export const updateProduct = (productId: string, formData: FormData) =>
  api.put(`/api/products/${productId}`, formData).then((r) => r.data);

export const patchProduct = (productId: string, payload: Record<string, unknown>) =>
  api.patch(`/api/products/${productId}/status`, payload).then((r) => r.data);

export const deleteProduct = (productId: string) =>
  api.delete(`/api/products/${productId}`).then((r) => r.data);

export const getProductCategories = () => api.get(`/api/categories`).then((r) => r.data);

export const reportProduct = (productId: string, payload: Record<string, unknown>) =>
  api.post(`/api/products/${productId}/report`, payload).then((r) => r.data);
