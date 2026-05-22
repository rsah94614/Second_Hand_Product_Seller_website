import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryBreakdownWidget } from './CategoryBreakdownWidget';

describe('CategoryBreakdownWidget', () => {
  const mockCategories = [
    {
      id: '1',
      name: 'Electronics',
      revenue: 500000,
      salesVolume: 100,
      percentOfTotal: 50,
      activeSellers: 25,
      avgOrderValue: 5000,
    },
    {
      id: '2',
      name: 'Books',
      revenue: 300000,
      salesVolume: 150,
      percentOfTotal: 30,
      activeSellers: 15,
      avgOrderValue: 2000,
    },
    {
      id: '3',
      name: 'Clothing',
      revenue: 200000,
      salesVolume: 200,
      percentOfTotal: 20,
      activeSellers: 10,
      avgOrderValue: 1000,
    },
  ];

  it('renders widget title', () => {
    render(<CategoryBreakdownWidget categories={mockCategories} />);
    expect(screen.getByText('Category Breakdown')).toBeInTheDocument();
  });

  it('renders all categories', () => {
    render(<CategoryBreakdownWidget categories={mockCategories} />);
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
  });

  it('displays category revenue in currency format', () => {
    render(<CategoryBreakdownWidget categories={mockCategories} />);
    expect(screen.getByText('₹5,00,000.00')).toBeInTheDocument();
    expect(screen.getByText('₹3,00,000.00')).toBeInTheDocument();
  });

  it('displays sales volume', () => {
    render(<CategoryBreakdownWidget categories={mockCategories} />);
    expect(screen.getByText('100 orders')).toBeInTheDocument();
    expect(screen.getByText('150 orders')).toBeInTheDocument();
  });

  it('displays percentage of total', () => {
    render(<CategoryBreakdownWidget categories={mockCategories} />);
    expect(screen.getByText('50.0% of total')).toBeInTheDocument();
    expect(screen.getByText('30.0% of total')).toBeInTheDocument();
  });

  it('displays active sellers count', () => {
    render(<CategoryBreakdownWidget categories={mockCategories} />);
    expect(screen.getByText('25 sellers')).toBeInTheDocument();
    expect(screen.getByText('15 sellers')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading is true', () => {
    const { container } = render(
      <CategoryBreakdownWidget categories={[]} loading={true} />
    );
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no categories', () => {
    render(<CategoryBreakdownWidget categories={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('displays custom title', () => {
    render(
      <CategoryBreakdownWidget
        title="Custom Title"
        categories={mockCategories}
      />
    );
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders progress bars for each category', () => {
    const { container } = render(
      <CategoryBreakdownWidget categories={mockCategories} />
    );
    const progressBars = container.querySelectorAll('[class*="bg-blue-600"]');
    expect(progressBars.length).toBe(mockCategories.length);
  });

  it('progress bar width matches percentage', () => {
    const { container } = render(
      <CategoryBreakdownWidget categories={mockCategories} />
    );
    const progressBars = container.querySelectorAll('[class*="bg-blue-600"]');
    
    // First category should have 50% width
    expect(progressBars[0]).toHaveStyle({ width: '50%' });
    // Second category should have 30% width
    expect(progressBars[1]).toHaveStyle({ width: '30%' });
  });
});
