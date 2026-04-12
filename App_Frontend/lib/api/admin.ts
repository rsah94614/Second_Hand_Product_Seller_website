import { api } from "./client";

export const getAdminOverview = () => api.get(`/api/admin/overview`).then((r) => r.data);

export const getAdminUsers = (queryString = "") =>
  api.get(`/api/admin/users?${queryString}`).then((r) => r.data);

export const updateAdminUser = (userId: string, payload: Record<string, unknown>) =>
  api.patch(`/api/admin/users/${userId}`, payload).then((r) => r.data);

export const getAdminProducts = (queryString = "") =>
  api.get(`/api/admin/products?${queryString}`).then((r) => r.data);

export const updateAdminProduct = (productId: string, payload: Record<string, unknown>) =>
  api.patch(`/api/admin/products/${productId}`, payload).then((r) => r.data);

export const deleteAdminProduct = (productId: string) =>
  api.delete(`/api/admin/products/${productId}`).then((r) => r.data);

export const getAdminCategories = () =>
  api.get(`/api/categories/admin/all`).then((r) => r.data);

export const createAdminCategory = (payload: Record<string, unknown>) =>
  api.post(`/api/categories`, payload).then((r) => r.data);

export const updateAdminCategory = (categoryId: string, payload: Record<string, unknown>) =>
  api.put(`/api/categories/${categoryId}`, payload).then((r) => r.data);

export const deleteAdminCategory = (categoryId: string) =>
  api.delete(`/api/categories/${categoryId}`).then((r) => r.data);

export const getAdminOrders = (queryString = "") =>
  api.get(`/api/admin/orders?${queryString}`).then((r) => r.data);

export const updateAdminOrder = (orderId: string, payload: Record<string, unknown>) =>
  api.patch(`/api/admin/orders/${orderId}`, payload).then((r) => r.data);

export const getAdminReports = (queryString = "") =>
  api.get(`/api/admin/reports${queryString ? `?${queryString}` : ""}`).then((r) => r.data);

export const updateAdminReport = (reportId: string, payload: Record<string, unknown>) =>
  api.patch(`/api/admin/reports/${reportId}`, payload).then((r) => r.data);

export const getAdminAuditLogs = (params?: Record<string, string>) =>
  api.get(`/api/admin/audit-logs`, { params }).then((r) => r.data);
