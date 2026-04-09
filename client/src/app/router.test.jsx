import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AppRouter from './router';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../features/home/pages/HomePage', () => ({ default: () => <div>Home Screen</div> }));
vi.mock('../features/auth/pages/Sign-In', () => ({ default: () => <div>Login Screen</div> }));
vi.mock('../features/auth/pages/Sign-Up', () => ({ default: () => <div>Register Screen</div> }));
vi.mock('../features/products/pages/ProductListPage', () => ({ default: () => <div>Product List Screen</div> }));
vi.mock('../features/products/pages/ProductDetailPage', () => ({ default: () => <div>Product Detail Screen</div> }));
vi.mock('../features/users/pages/ProfilePage', () => ({ default: () => <div>Profile Screen</div> }));
vi.mock('../features/users/pages/WishlistPage', () => ({ default: () => <div>Wishlist Screen</div> }));
vi.mock('../features/notifications/pages/NotificationsPage', () => ({ default: () => <div>Notifications Screen</div> }));
vi.mock('../features/products/pages/CreateProductPage', () => ({ default: () => <div>Create Product Screen</div> }));
vi.mock('../features/products/pages/EditProductPage', () => ({ default: () => <div>Edit Product Screen</div> }));
vi.mock('../features/products/pages/MyProductsPage', () => ({ default: () => <div>My Products Screen</div> }));
vi.mock('../features/products/pages/DashboardPage', () => ({ default: () => <div>User Dashboard Screen</div> }));
vi.mock('../features/orders/pages/OrderHistoryPage', () => ({ default: () => <div>Order History Screen</div> }));
vi.mock('../features/orders/pages/PlaceOrderPage', () => ({ default: () => <div>Place Order Screen</div> }));
vi.mock('../features/chat/pages/ChatPage', () => ({ default: () => <div>Chat Screen</div> }));
vi.mock('../features/cart/pages/CartPage', () => ({ default: () => <div>Cart Screen</div> }));
vi.mock('../features/admin/pages/AdminDashboardPage', () => ({ default: () => <div>Admin Dashboard Screen</div> }));
vi.mock('../features/admin/pages/AdminUsersPage', () => ({ default: () => <div>Admin Users Screen</div> }));
vi.mock('../features/admin/pages/AdminProductsPage', () => ({ default: () => <div>Admin Products Screen</div> }));
vi.mock('../features/admin/pages/AdminCategoriesPage', () => ({ default: () => <div>Admin Categories Screen</div> }));
vi.mock('../features/admin/pages/AdminOrdersPage', () => ({ default: () => <div>Admin Orders Screen</div> }));
vi.mock('../features/admin/pages/AdminReportsPage', () => ({ default: () => <div>Admin Reports Screen</div> }));

const renderRouter = (route, authState) => {
  useAuth.mockReturnValue(authState);

  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppRouter />
    </MemoryRouter>
  );
};

describe('AppRouter smoke tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the public home route', () => {
    renderRouter('/', { user: null, loading: false });

    expect(screen.getByText('Home Screen')).toBeInTheDocument();
  });

  it('redirects anonymous users away from protected routes', () => {
    renderRouter('/dashboard', { user: null, loading: false });

    expect(screen.getByText('Login Screen')).toBeInTheDocument();
  });

  it('renders the user dashboard for authenticated users', () => {
    renderRouter('/dashboard', { user: { role: 'user' }, loading: false });

    expect(screen.getByText('User Dashboard Screen')).toBeInTheDocument();
  });

  it('renders the admin dashboard for admins', () => {
    renderRouter('/admin-dashboard', { user: { role: 'admin' }, loading: false });

    expect(screen.getByText('Admin Dashboard Screen')).toBeInTheDocument();
  });
});
