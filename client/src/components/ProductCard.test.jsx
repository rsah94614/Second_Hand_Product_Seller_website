import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProductCard from './ProductCard';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../features/users/api/userApi', () => ({
  toggleWishlist: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const sampleProduct = {
  _id: 'product-1',
  title: 'Editorial Test Chair',
  price: 12500,
  category: 'Home & Garden',
  condition: 'Good',
  location: 'Kolkata',
  createdAt: '2026-03-20T00:00:00.000Z',
  views: 17,
  images: ['https://example.com/chair.jpg'],
  averageRating: 4.6,
  reviewCount: 8,
  isSold: false,
};

const renderProductCard = (product = sampleProduct) => {
  const queryClient = new QueryClient();
  useAuth.mockReturnValue({
    user: null,
    refreshUser: vi.fn(),
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ProductCard product={product} highlightLabel="Trending" />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ProductCard', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders core product information', () => {
    renderProductCard();

    expect(screen.getByText('Editorial Test Chair')).toBeInTheDocument();
    expect(screen.getByText('Trending')).toBeInTheDocument();
    expect(screen.getByText('Home & Garden')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText(/₹12,500/)).toBeInTheDocument();
    expect(screen.getByText('Kolkata')).toBeInTheDocument();
  });

  it('shows a sold badge when the product is unavailable', () => {
    renderProductCard({
      ...sampleProduct,
      isSold: true,
      averageRating: 0,
      reviewCount: 0,
    });

    expect(screen.getByText('SOLD')).toBeInTheDocument();
  });
});
