import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import SalesDashboardPage from './SalesDashboardPage';
import * as adminApi from '../api/adminApi';

// Mock the API
vi.mock('../api/adminApi');

// Mock child components
vi.mock('../../../components/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('../../../components/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

const mockMetrics = {
  totalRevenue: 1000000,
  salesVolume: 500,
  avgOrderValue: 2000,
  activeSellers: 50,
  revenueChange: 15.5,
  volumeChange: 10.2,
  aovChange: 5.1,
  sellersChange: 3.2,
};

const mockTrends = {
  trends: [
    { date: '2024-03-01', revenue: 30000 },
    { date: '2024-03-02', revenue: 35000 },
    { date: '2024-03-03', revenue: 32000 },
  ],
};

const mockTopProducts = {
  products: [
    {
      _id: '1',
      title: 'Product 1',
      category: 'Electronics',
      revenue: 100000,
      quantitySold: 50,
    },
    {
      _id: '2',
      title: 'Product 2',
      category: 'Books',
      revenue: 80000,
      quantitySold: 40,
    },
  ],
};

const mockCategories = {
  categories: [
    {
      id: '1',
      name: 'Electronics',
      revenue: 500000,
      salesVolume: 100,
      percentOfTotal: 50,
      activeSellers: 25,
    },
    {
      id: '2',
      name: 'Books',
      revenue: 300000,
      salesVolume: 150,
      percentOfTotal: 30,
      activeSellers: 15,
    },
  ],
};

const mockSellers = {
  sellers: [
    {
      _id: '1',
      sellerName: 'Seller 1',
      totalRevenue: 200000,
      completedOrders: 100,
      avgOrderValue: 2000,
    },
    {
      _id: '2',
      sellerName: 'Seller 2',
      totalRevenue: 150000,
      completedOrders: 75,
      avgOrderValue: 2000,
    },
  ],
};

const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('SalesDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.getDashboardMetrics.mockResolvedValue(mockMetrics);
    adminApi.getSalesTrends.mockResolvedValue(mockTrends);
    adminApi.getTopProducts.mockResolvedValue(mockTopProducts);
    adminApi.getCategoryBreakdown.mockResolvedValue(mockCategories);
    adminApi.getSellerRankings.mockResolvedValue(mockSellers);
  });

  it('renders dashboard header', async () => {
    renderWithProviders(<SalesDashboardPage />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText('Sales Dashboard')).toBeInTheDocument();
  });

  it('renders metric cards with data', async () => {
    renderWithProviders(<SalesDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Sales Volume')).toBeInTheDocument();
      expect(screen.getByText('Avg Order Value')).toBeInTheDocument();
      expect(screen.getByText('Active Sellers')).toBeInTheDocument();
    });
  });

  it('renders date range picker', () => {
    renderWithProviders(<SalesDashboardPage />);
    expect(screen.getByText(/\d{2}\/\d{2}\/\d{4} - \d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument();
  });

  it('renders revenue chart', async () => {
    renderWithProviders(<SalesDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('30-Day Revenue Trend')).toBeInTheDocument();
    });
  });

  it('renders top products widget', async () => {
    renderWithProviders(<SalesDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Top 5 Products')).toBeInTheDocument();
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });
  });

  it('renders top sellers widget', async () => {
    renderWithProviders(<SalesDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Top 5 Sellers')).toBeInTheDocument();
      expect(screen.getByText('Seller 1')).toBeInTheDocument();
    });
  });

  it('renders category breakdown widget', async () => {
    renderWithProviders(<SalesDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Category Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });
  });

  it('renders refresh button', () => {
    renderWithProviders(<SalesDashboardPage />);
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('renders export PDF button', () => {
    renderWithProviders(<SalesDashboardPage />);
    expect(screen.getByText('Export PDF')).toBeInTheDocument();
  });

  it('calls API with correct date parameters', async () => {
    renderWithProviders(<SalesDashboardPage />);

    await waitFor(() => {
      expect(adminApi.getDashboardMetrics).toHaveBeenCalled();
      const call = adminApi.getDashboardMetrics.mock.calls[0][0];
      expect(call).toHaveProperty('startDate');
      expect(call).toHaveProperty('endDate');
    });
  });

  it('renders footer', async () => {
    renderWithProviders(<SalesDashboardPage />);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
