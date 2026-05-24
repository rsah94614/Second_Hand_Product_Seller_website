import { api } from "./client";

export const getAdminOverview = () => api.get(`/api/admin/overview`).then((r) => r.data);

export const getAdminUsers = (queryString = "") =>
  api.get(`/api/admin/users?${queryString}`).then((r) => r.data);

export const updateAdminUser = (userId: string, payload: Record<string, unknown>) =>
  api.patch(`/api/admin/users/${userId}`, payload).then((r) => r.data);

export const suspendUser = (userId: string, payload: Record<string, unknown>) =>
  api.patch(`/api/admin/users/${userId}/suspend`, payload).then((r) => r.data);

export const getAdminSuspiciousUsers = (queryString = "") =>
  api.get(`/api/admin/users/suspicious?${queryString}`).then((r) => r.data);

export const getAdminProducts = (queryString = "") =>
  api.get(`/api/admin/products?${queryString}`).then((r) => r.data);

export const updateAdminProduct = (productId: string, payload: Record<string, unknown>) =>
  api.patch(`/api/admin/products/${productId}`, payload).then((r) => r.data);

export const deleteAdminProduct = (productId: string) =>
  api.delete(`/api/admin/products/${productId}`).then((r) => r.data);

export const getAdminSuspiciousProducts = (queryString = "") =>
  api.get(`/api/admin/products/suspicious?${queryString}`).then((r) => r.data);

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

export const addToModerationQueue = (payload: Record<string, unknown>) =>
  api.post(`/api/admin/moderation-queue`, payload).then((r) => r.data);

export const assignModerationItem = (itemId: string, payload: Record<string, unknown>) =>
  api.patch(`/api/admin/moderation-queue/${itemId}/assign`, payload).then((r) => r.data);

export const resolveModerationItem = (itemId: string, payload: { resolution: string }) =>
  api.patch(`/api/admin/moderation-queue/${itemId}/resolve`, payload).then((r) => r.data);

export const getModerationStats = () =>
  api.get(`/api/admin/moderation-queue/stats`).then((r) => r.data);

// ── Phase 2: Moderation Rules ─────────────────────────────────────────────────
export const getModerationRules = () =>
  api.get(`/api/admin/rules`).then((r) => r.data);

export const createModerationRule = (payload: Record<string, unknown>) =>
  api.post(`/api/admin/rules`, payload).then((r) => r.data);

export const updateModerationRule = (ruleId: string, payload: Record<string, unknown>) =>
  api.put(`/api/admin/rules/${ruleId}`, payload).then((r) => r.data);

export const deleteModerationRule = (ruleId: string) =>
  api.delete(`/api/admin/rules/${ruleId}`).then((r) => r.data);

export const toggleModerationRule = (ruleId: string) =>
  api.patch(`/api/admin/rules/${ruleId}/toggle`).then((r) => r.data);

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

export const bulkUpdateProducts = (payload: Record<string, unknown>) =>
  api.post(`/api/admin/bulk/products/update`, payload).then((r) => r.data);

// ── Phase 3: Category Analytics ───────────────────────────────────────────────
export const getCategoryAnalytics = () =>
  api.get(`/api/categories/analytics`).then((r) => r.data);

// ── Phase 6: Sales & Revenue Reports ──────────────────────────────────────────
export const getDashboardMetrics = (params?: Record<string, string>) =>
  api.get(`/api/admin/reports/dashboard`, { params }).then((r) => r.data?.data || {});

export const getTopProducts = (params?: Record<string, string>) =>
  api.get(`/api/admin/reports/top-products`, { params }).then((r) => ({ products: r.data?.data || [] }));

export const getCategoryBreakdown = (params?: Record<string, string>) =>
  api.get(`/api/admin/reports/categories`, { params }).then((r) => ({ categories: r.data?.data || [] }));

export const getSalesTrends = (params?: Record<string, string>) =>
  api.get(`/api/admin/reports/trends`, { params }).then((r) => ({ trends: r.data?.data || [] }));

export const getSellerRankings = (params?: Record<string, string>) =>
  api.get(`/api/admin/reports/sellers`, { params }).then((r) => ({ sellers: r.data?.data || [] }));

export const getPaymentMetrics = (params?: Record<string, string>) =>
  api.get(`/api/admin/reports/payments`, { params }).then((r) => r.data?.data || {});

export const getTransactionMetrics = (params?: Record<string, string>) =>
  api.get(`/api/admin/reports/transactions`, { params }).then((r) => r.data?.data || {});

export const comparePeriods = (params?: Record<string, string>) =>
  api.get(`/api/admin/reports/compare`, { params }).then((r) => r.data?.data || {});

export const exportReportPDF = (payload: Record<string, unknown>) =>
  api.post(`/api/admin/reports/export-pdf`, payload).then((r) => r.data);

export const getEmailPreferences = () =>
  api.get(`/api/admin/reports/email-preferences`).then((r) => r.data);

export const updateEmailPreferences = (payload: Record<string, unknown>) =>
  api.put(`/api/admin/reports/email-preferences`, payload).then((r) => r.data);

export const getReportAuditLog = (params?: Record<string, string>) =>
  api.get(`/api/admin/reports/audit-log`, { params }).then((r) => r.data);

// ── Disputes ──────────────────────────────────────────────────────────────────
export const getAdminDisputes = () =>
  api.get(`/api/orders/disputes/all`).then((r) => r.data);

export const getAdminDisputeById = (id: string) =>
  api.get(`/api/orders/disputes/${id}`).then((r) => r.data);

export const resolveAdminDispute = (id: string, payload: { resolution: string, adminNotes: string }) =>
  api.patch(`/api/orders/disputes/${id}/resolve`, payload).then((r) => r.data);

export const rejectAdminDispute = (id: string, payload: { reason: string, adminNotes: string }) =>
  api.patch(`/api/orders/disputes/${id}/reject`, payload).then((r) => r.data);
