import { api } from "./client";

export const getAdminOverview = () => api.get(`/api/admin/overview`).then((r) => r.data);

export const getAdminUsers = (queryString = "") =>
  api.get(`/api/admin/users?${queryString}`).then((r) => r.data);

export const updateAdminUser = (userId: string, payload: Record<string, unknown>) =>
  api.patch(`/api/admin/users/${userId}`, payload).then((r) => r.data);

export const suspendUser = (userId: string, payload: Record<string, unknown>) =>
  api.patch(`/api/admin/users/${userId}/suspend`, payload).then((r) => r.data);

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

// ── Phase 2: Moderation Queue ─────────────────────────────────────────────────
export const getModerationQueue = (queryString = "") =>
  api.get(`/api/admin/moderation-queue${queryString ? `?${queryString}` : ""}`).then((r) => r.data);

export const resolveModerationItem = (itemId: string, payload: { resolution: string }) =>
  api.patch(`/api/admin/moderation-queue/${itemId}/resolve`, payload).then((r) => r.data);

// ── Phase 2: Seller Verifications ─────────────────────────────────────────────
export const getSellerVerifications = (status = "pending") =>
  api.get(`/api/admin/seller-verifications`, { params: { status } }).then((r) => r.data);

export const approveSellerVerification = (userId: string) =>
  api.post(`/api/admin/seller-verifications/${userId}/approve`).then((r) => r.data);

export const rejectSellerVerification = (userId: string, payload: { reason: string }) =>
  api.post(`/api/admin/seller-verifications/${userId}/reject`, payload).then((r) => r.data);

// ── Phase 3: Bulk Actions ─────────────────────────────────────────────────────
export const bulkSuspendUsers = (payload: { userIds: string[]; suspended: boolean; reason?: string }) =>
  api.post(`/api/admin/bulk/users/suspend`, payload).then((r) => r.data);

export const bulkDeleteProducts = (payload: { productIds: string[] }) =>
  api.post(`/api/admin/bulk/products/delete`, payload).then((r) => r.data);

// ── Phase 3: Activity Timeline ────────────────────────────────────────────────
export const getAdminActivityTimeline = (queryString = "") =>
  api.get(`/api/admin/activity${queryString ? `?${queryString}` : ""}`).then((r) => r.data);
