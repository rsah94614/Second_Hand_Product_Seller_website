import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Home from '../pages/Home';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import ProductListPage from '../features/products/pages/ProductListPage';
import ProductDetailPage from '../features/products/pages/ProductDetailPage';
import ProfilePage from '../features/users/pages/ProfilePage';
import CreateProductPage from '../features/products/pages/CreateProductPage';
import EditProductPage from '../features/products/pages/EditProductPage';
import MyProductsPage from '../features/products/pages/MyProductsPage';
import DashboardPage from '../features/products/pages/DashboardPage';
import OrderHistoryPage from '../features/orders/pages/OrderHistoryPage';
import PlaceOrderPage from '../features/orders/pages/PlaceOrderPage';
import ChatPage from '../features/chat/pages/ChatPage';
import Cart from '../pages/Cart';
import ProtectedRoute from '../components/shared/ProtectedRoute';
import AdminDashboardPage from '../features/admin/pages/AdminDashboardPage';
import AdminUsersPage from '../features/admin/pages/AdminUsersPage';
import AdminProductsPage from '../features/admin/pages/AdminProductsPage';
import AdminCategoriesPage from '../features/admin/pages/AdminCategoriesPage';
import AdminOrdersPage from '../features/admin/pages/AdminOrdersPage';

const AppRouter = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/products" element={<ProductListPage />} />
    <Route path="/products/:id" element={<ProductDetailPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['user']}><DashboardPage /></ProtectedRoute>} />
    <Route path="/seller-dashboard" element={<Navigate to="/dashboard" replace />} />
    <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
    <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['admin']}><AdminProductsPage /></ProtectedRoute>} />
    <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin']}><AdminCategoriesPage /></ProtectedRoute>} />
    <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrdersPage /></ProtectedRoute>} />
    <Route path="/create-product" element={<ProtectedRoute allowedRoles={['user']}><CreateProductPage /></ProtectedRoute>} />
    <Route path="/edit-product/:id" element={<ProtectedRoute allowedRoles={['user']}><EditProductPage /></ProtectedRoute>} />
    <Route path="/my-products" element={<ProtectedRoute allowedRoles={['user']}><MyProductsPage /></ProtectedRoute>} />
    <Route path="/order/:id" element={<PlaceOrderPage />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/orders" element={<OrderHistoryPage />} />
    <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
  </Routes>
);

export default AppRouter;
