import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CreateProduct from './pages/CreateProduct';
import EditProduct from './pages/EditProduct';
import MyProducts from './pages/MyProducts';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategories';
import Cart from './pages/Cart';
import OrderHistory from './pages/OrderHistory';
import PlaceOrder from './pages/Order';

import Chat from './pages/Chat';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['user']}><SellerDashboard /></ProtectedRoute>} />
            <Route path="/seller-dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['admin']}><AdminProducts /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin']}><AdminCategories /></ProtectedRoute>} />
            <Route path="/create-product" element={<ProtectedRoute allowedRoles={['user']}><CreateProduct /></ProtectedRoute>} />
            <Route path="/edit-product/:id" element={<ProtectedRoute allowedRoles={['user']}><EditProduct /></ProtectedRoute>} />
            <Route path="/my-products" element={<ProtectedRoute allowedRoles={['user']}><MyProducts /></ProtectedRoute>} />
            <Route path="/order/:id" element={<PlaceOrder />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
