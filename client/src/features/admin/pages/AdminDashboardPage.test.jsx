import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminDashboardPage from './AdminDashboardPage';

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

vi.mock('../../../components/Header', () => ({ default: () => <div>Header</div> }));
vi.mock('../../../components/Footer', () => ({ default: () => <div>Footer</div> }));
vi.mock('../api/adminApi', () => ({
  getAdminOverview: vi.fn(),
}));

const { useQuery } = await import('@tanstack/react-query');

const renderPage = () => {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('AdminDashboardPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders metrics and admin tools from overview data', () => {
    useQuery.mockReturnValue({
      isLoading: false,
      data: {
        metrics: {
          totalUsers: 12,
          activeProducts: 8,
          totalOrders: 5,
          totalRevenue: 45000,
          openReports: 2,
        },
        topProducts: [
          {
            _id: 'p1',
            title: 'Popular Listing',
            images: ['https://example.com/item.jpg'],
            category: 'Electronics',
            location: 'Delhi',
            views: 49,
          },
        ],
        recentUsers: [
          {
            _id: 'u1',
            role: 'user',
            createdAt: '2026-04-03T00:00:00.000Z',
          },
        ],
        recentOrders: [
          {
            _id: '66112233445566778899aabb',
            status: 'processing',
            createdAt: '2026-04-03T00:00:00.000Z',
          },
        ],
        categoryBreakdown: [
          {
            category: 'Electronics',
            count: 4,
          },
        ],
      },
    });

    renderPage();

    expect(screen.getByText('Platform Overview')).toBeInTheDocument();
    expect(screen.getByText('Manage Users')).toBeInTheDocument();
    expect(screen.getByText('Monitor Orders')).toBeInTheDocument();
    expect(screen.getByText('Popular Listing')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('shows the empty top-products state when overview has no products', () => {
    useQuery.mockReturnValue({
      isLoading: false,
      data: {
        metrics: {},
        topProducts: [],
        recentUsers: [],
        recentOrders: [],
        categoryBreakdown: [],
      },
    });

    renderPage();

    expect(screen.getByText('No product data yet.')).toBeInTheDocument();
  });
});
