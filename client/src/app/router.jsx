import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from '../features/home/pages/HomePage';
import SignInPage from '../features/auth/pages/Sign-In';
import SignUpPage from '../features/auth/pages/Sign-Up';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage';
import VerifyEmailPage from '../features/auth/pages/VerifyEmailPage';
import ProductListPage from '../features/products/pages/ProductListPage';
import ProductDetailPage from '../features/products/pages/ProductDetailPage';
import ProfilePage from '../features/users/pages/ProfilePage';
import PublicProfilePage from '../features/users/pages/PublicProfilePage';
import WishlistPage from '../features/users/pages/WishlistPage';
import NotificationsPage from '../features/notifications/pages/NotificationsPage';
import NotificationPreferencesPage from '../features/notifications/pages/NotificationPreferencesPage';
import ReviewSellerPage from '../features/users/pages/ReviewSellerPage';
import SettingsPage from '../features/users/pages/settings/SettingsPage';
import BlockedUsersPage from '../features/users/pages/settings/BlockedUsersPage';
import DeleteAccountPage from '../features/users/pages/settings/DeleteAccountPage';
import ActiveDevicesPage from '../features/users/pages/settings/ActiveDevicesPage';


import HelpCenterPage from '../features/users/pages/settings/HelpCenterPage';
import LegalPage from '../features/users/pages/settings/LegalPage';

import CreateProductPage from '../features/products/pages/CreateProductPage';
import EditProductPage from '../features/products/pages/EditProductPage';
import MyProductsPage from '../features/products/pages/MyProductsPage';
import DashboardPage from '../features/products/pages/DashboardPage';
import OrderHistoryPage from '../features/orders/pages/OrderHistoryPage';
import PlaceOrderPage from '../features/orders/pages/PlaceOrderPage';
import ChatPage from '../features/chat/pages/ChatPage';
import CartPage from '../features/cart/pages/CartPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage';
import AdminUsersPage from '../features/admin/pages/AdminUsersPage';
import AdminProductsPage from '../features/admin/pages/AdminProductsPage';
import AdminCategoriesPage from '../features/admin/pages/AdminCategoriesPage';
import AdminOrdersPage from '../features/admin/pages/AdminOrdersPage';
import AdminReportsPage from '../features/admin/pages/AdminReportsPage';
import AdminAuditLogsPage from '../features/admin/pages/AdminAuditLogsPage';
import AdminModerationQueuePage from '../features/admin/pages/AdminModerationQueuePage';
import AdminSellerVerificationsPage from '../features/admin/pages/AdminSellerVerificationsPage';

const AppRouter = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/products" element={<ProductListPage />} />
    <Route path="/products/:id" element={<ProductDetailPage />} />
    <Route path="/login" element={<SignInPage />} />
    <Route path="/register" element={<SignUpPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="/users/:id" element={<PublicProfilePage />} />
    <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
    <Route path="/notifications/preferences" element={<ProtectedRoute><NotificationPreferencesPage /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['user']}><DashboardPage /></ProtectedRoute>} />
    <Route path="/seller-dashboard" element={<Navigate to="/dashboard" replace />} />
    <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
    <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['admin']}><AdminProductsPage /></ProtectedRoute>} />
    <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin']}><AdminCategoriesPage /></ProtectedRoute>} />
    <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrdersPage /></ProtectedRoute>} />
    <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReportsPage /></ProtectedRoute>} />
    <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><AdminAuditLogsPage /></ProtectedRoute>} />
    <Route path="/admin/moderation-queue" element={<ProtectedRoute allowedRoles={['admin']}><AdminModerationQueuePage /></ProtectedRoute>} />
    <Route path="/admin/seller-verifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminSellerVerificationsPage /></ProtectedRoute>} />
    <Route path="/create-product" element={<ProtectedRoute allowedRoles={['user']}><CreateProductPage /></ProtectedRoute>} />
    <Route path="/edit-product/:id" element={<ProtectedRoute allowedRoles={['user']}><EditProductPage /></ProtectedRoute>} />
    <Route path="/my-products" element={<ProtectedRoute allowedRoles={['user']}><MyProductsPage /></ProtectedRoute>} />
    <Route path="/order/:id" element={<ProtectedRoute><PlaceOrderPage /></ProtectedRoute>} />
    <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
    <Route path="/orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
    <Route path="/review/:sellerId" element={<ProtectedRoute><ReviewSellerPage /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    <Route path="/settings/blocked-users" element={<ProtectedRoute><BlockedUsersPage /></ProtectedRoute>} />
    <Route path="/settings/devices" element={<ProtectedRoute><ActiveDevicesPage /></ProtectedRoute>} />
    <Route path="/settings/delete-account" element={<ProtectedRoute><DeleteAccountPage /></ProtectedRoute>} />

    <Route path="/help" element={<HelpCenterPage />} />
    <Route path="/terms" element={<LegalPage />} />
    <Route path="/privacy" element={<LegalPage />} />
    <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
  </Routes>
);

export default AppRouter;
