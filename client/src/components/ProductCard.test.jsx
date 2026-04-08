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
  category: 'Furniture & Decor',
  condition: 'Good',
  location: 'Kolkata',
  createdAt: '2026-03-20T00:00:00.000Z',
  images: ['https://example.com/chair.jpg'],
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
        <ProductCard product={product} highlightLabel="Fresh" />
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
    expect(screen.getByText('Fresh')).toBeInTheDocument();
    expect(screen.getByText('Furniture & Decor')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText(/\u20b912,500/)).toBeInTheDocument();
    expect(screen.getByText('Kolkata')).toBeInTheDocument();
    expect(screen.getByText('Listed')).toBeInTheDocument();
  });

  it('shows a sold badge when the product is unavailable', () => {
    renderProductCard({
      ...sampleProduct,
      isSold: true,
    });

    expect(screen.getByText('SOLD')).toBeInTheDocument();
  });
});
