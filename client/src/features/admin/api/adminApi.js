import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

export const getAdminOverview = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/overview`);
  return response.data;
};

export const getAdminUsers = async (queryString = '') => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/users?${queryString}`);
  return response.data;
};

export const updateAdminUser = async (userId, payload) => {
  const response = await axios.patch(`${API_BASE_URL}/api/admin/users/${userId}`, payload);
  return response.data;
};

export const getAdminSuspiciousUsers = async (queryString = '') => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/users/suspicious?${queryString}`);
  return response.data;
};

export const suspendUser = async (userId, payload) => {
  const response = await axios.patch(`${API_BASE_URL}/api/admin/users/${userId}/suspend`, payload);
  return response.data;
};

export const getAdminProducts = async (queryString = '') => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/products?${queryString}`);
  return response.data;
};

export const updateAdminProduct = async (productId, payload) => {
  const response = await axios.patch(`${API_BASE_URL}/api/admin/products/${productId}`, payload);
  return response.data;
};

export const getAdminSuspiciousProducts = async (queryString = '') => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/products/suspicious?${queryString}`);
  return response.data;
};

export const deleteAdminProduct = async (productId) => {
  const response = await axios.delete(`${API_BASE_URL}/api/admin/products/${productId}`);
  return response.data;
};

export const getAdminCategories = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/categories/admin/all`);
  return response.data;
};

export const createAdminCategory = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/api/categories`, payload);
  return response.data;
};

export const updateAdminCategory = async (categoryId, payload) => {
  const response = await axios.put(`${API_BASE_URL}/api/categories/${categoryId}`, payload);
  return response.data;
};

export const deleteAdminCategory = async (categoryId) => {
  const response = await axios.delete(`${API_BASE_URL}/api/categories/${categoryId}`);
  return response.data;
};

export const getAdminOrders = async (queryString = '') => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/orders?${queryString}`);
  return response.data;
};

export const updateAdminOrder = async (orderId, payload) => {
  const response = await axios.patch(`${API_BASE_URL}/api/admin/orders/${orderId}`, payload);
  return response.data;
};

export const getAdminReports = async (queryString = '') => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/reports${queryString ? `?${queryString}` : ''}`);
  return response.data;
};

export const updateAdminReport = async (reportId, payload) => {
  const response = await axios.patch(`${API_BASE_URL}/api/admin/reports/${reportId}`, payload);
  return response.data;
};

// ── Phase 2: Moderation Queue ─────────────────────────────────────────────────
export const getModerationQueue = async (queryString = '') =>
  axios.get(`${API_BASE_URL}/api/admin/moderation-queue${queryString ? `?${queryString}` : ''}`).then((r) => r.data);

export const addToModerationQueue = async (payload) =>
  axios.post(`${API_BASE_URL}/api/admin/moderation-queue`, payload).then((r) => r.data);

export const assignModerationItem = async (itemId, payload) =>
  axios.patch(`${API_BASE_URL}/api/admin/moderation-queue/${itemId}/assign`, payload).then((r) => r.data);

export const resolveModerationItem = async (itemId, payload) =>
  axios.patch(`${API_BASE_URL}/api/admin/moderation-queue/${itemId}/resolve`, payload).then((r) => r.data);

export const getModerationStats = async () =>
  axios.get(`${API_BASE_URL}/api/admin/moderation-queue/stats`).then((r) => r.data);

// ── Phase 2: Moderation Rules ─────────────────────────────────────────────────
export const getModerationRules = async () =>
  axios.get(`${API_BASE_URL}/api/admin/rules`).then((r) => r.data);

export const createModerationRule = async (payload) =>
  axios.post(`${API_BASE_URL}/api/admin/rules`, payload).then((r) => r.data);

export const updateModerationRule = async (ruleId, payload) =>
  axios.put(`${API_BASE_URL}/api/admin/rules/${ruleId}`, payload).then((r) => r.data);

export const deleteModerationRule = async (ruleId) =>
  axios.delete(`${API_BASE_URL}/api/admin/rules/${ruleId}`).then((r) => r.data);

export const toggleModerationRule = async (ruleId) =>
  axios.patch(`${API_BASE_URL}/api/admin/rules/${ruleId}/toggle`).then((r) => r.data);

// ── Phase 2: Seller Verifications ─────────────────────────────────────────────
export const getSellerVerifications = async (queryString = '') =>
  axios.get(`${API_BASE_URL}/api/admin/seller-verifications${queryString ? `?${queryString}` : ''}`).then((r) => r.data);

export const approveSellerVerification = async (userId) =>
  axios.post(`${API_BASE_URL}/api/admin/seller-verifications/${userId}/approve`).then((r) => r.data);

export const rejectSellerVerification = async (userId, payload) =>
  axios.post(`${API_BASE_URL}/api/admin/seller-verifications/${userId}/reject`, payload).then((r) => r.data);

// ── Phase 3: Activity Timeline ────────────────────────────────────────────────
export const getAdminActivityTimeline = async (queryString = '') =>
  axios.get(`${API_BASE_URL}/api/admin/activity${queryString ? `?${queryString}` : ''}`).then((r) => r.data);

// ── Phase 3: Bulk Actions ─────────────────────────────────────────────────────
export const bulkSuspendUsers = async (payload) =>
  axios.post(`${API_BASE_URL}/api/admin/bulk/users/suspend`, payload).then((r) => r.data);

export const bulkDeleteProducts = async (payload) =>
  axios.post(`${API_BASE_URL}/api/admin/bulk/products/delete`, payload).then((r) => r.data);

export const bulkUpdateProducts = async (payload) =>
  axios.post(`${API_BASE_URL}/api/admin/bulk/products/update`, payload).then((r) => r.data);

// ── Phase 3: Category Analytics ───────────────────────────────────────────────
export const getCategoryAnalytics = async () =>
  axios.get(`${API_BASE_URL}/api/categories/analytics`).then((r) => r.data);

// ── Phase 6: Sales & Revenue Reports ──────────────────────────────────────────
export const getDashboardMetrics = async (params = {}) => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/reports/dashboard`, { params });
  return response.data?.data || {};
};

export const getTopProducts = async (params = {}) => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/reports/top-products`, { params });
  return { products: response.data?.data || [] };
};

export const getCategoryBreakdown = async (params = {}) => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/reports/categories`, { params });
  return { categories: response.data?.data || [] };
};

export const getSalesTrends = async (params = {}) => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/reports/trends`, { params });
  return { trends: response.data?.data || [] };
};

export const getSellerRankings = async (params = {}) => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/reports/sellers`, { params });
  return { sellers: response.data?.data || [] };
};

export const getPaymentMetrics = async (params = {}) => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/reports/payments`, { params });
  return response.data?.data || {};
};

export const getTransactionMetrics = async (params = {}) => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/reports/transactions`, { params });
  return response.data?.data || {};
};

export const comparePeriods = async (params = {}) => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/reports/compare`, { params });
  return response.data?.data || {};
};

export const exportReportPDF = async (payload) => {
  // Transform payload to match backend expectations
  const transformedPayload = {
    reportType: payload.reportType,
    dateRange: {
      startDate: payload.startDate,
      endDate: payload.endDate,
    },
  };
  
  console.log('Sending PDF export request:', JSON.stringify(transformedPayload, null, 2));
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/admin/reports/export-pdf`,
      transformedPayload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('PDF export response:', response.data);
    
    // Construct the download URL
    if (response.data.data && response.data.data.fileName) {
      response.data.data.downloadUrl = `${API_BASE_URL}/api/admin/reports/download/${response.data.data.fileName}`;
    }
    
    return response.data.data;
  } catch (error) {
    console.error('PDF export error details:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      data: error.response?.data,
      requestData: transformedPayload,
    });
    throw error;
  }
};

export const downloadProtectedFile = async (downloadUrl, fileName) => {
  const response = await axios.get(downloadUrl, {
    responseType: 'blob',
  });

  const objectUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(objectUrl);
};

export const getEmailPreferences = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/reports/email-preferences`);
  return response.data;
};

export const updateEmailPreferences = async (payload) => {
  const response = await axios.put(`${API_BASE_URL}/api/admin/reports/email-preferences`, payload);
  return response.data;
};

export const getReportAuditLog = async (params = {}) => {
  const response = await axios.get(`${API_BASE_URL}/api/admin/reports/audit-log`, { params });
  return response.data;
};
