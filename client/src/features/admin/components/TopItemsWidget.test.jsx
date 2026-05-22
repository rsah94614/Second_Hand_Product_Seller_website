import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShoppingCart } from 'lucide-react';
import { TopItemsWidget } from './TopItemsWidget';

describe('TopItemsWidget', () => {
  const mockItems = [
    {
      id: '1',
      title: 'Product 1',
      subtitle: 'Category A',
      value: 50000,
      valueLabel: '100 sold',
      rank: 1,
      icon: ShoppingCart,
    },
    {
      id: '2',
      title: 'Product 2',
      subtitle: 'Category B',
      value: 40000,
      valueLabel: '80 sold',
      rank: 2,
      icon: ShoppingCart,
    },
  ];

  it('renders widget title', () => {
    render(<TopItemsWidget title="Top Products" items={mockItems} />);
    expect(screen.getByText('Top Products')).toBeInTheDocument();
  });

  it('renders all items', () => {
    render(<TopItemsWidget title="Top Products" items={mockItems} />);
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  it('displays item rank', () => {
    render(<TopItemsWidget title="Top Products" items={mockItems} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays item subtitle', () => {
    render(<TopItemsWidget title="Top Products" items={mockItems} />);
    expect(screen.getByText('Category A')).toBeInTheDocument();
    expect(screen.getByText('Category B')).toBeInTheDocument();
  });

  it('displays item value label', () => {
    render(<TopItemsWidget title="Top Products" items={mockItems} />);
    expect(screen.getByText('100 sold')).toBeInTheDocument();
    expect(screen.getByText('80 sold')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading is true', () => {
    const { container } = render(
      <TopItemsWidget title="Top Products" items={[]} loading={true} />
    );
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no items', () => {
    render(<TopItemsWidget title="Top Products" items={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('calls onViewAll when View All button is clicked', () => {
    const onViewAll = vi.fn();

    render(
      <TopItemsWidget title="Top Products" items={mockItems} onViewAll={onViewAll} />
    );

    const viewAllButton = screen.getByText('View All');
    fireEvent.click(viewAllButton);

    expect(onViewAll).toHaveBeenCalled();
  });

  it('uses custom value formatter', () => {
    const customFormatter = (value) => `$${value}`;
    render(
      <TopItemsWidget
        title="Top Products"
        items={mockItems}
        valueFormatter={customFormatter}
      />
    );

    expect(screen.getByText('$50000')).toBeInTheDocument();
    expect(screen.getByText('$40000')).toBeInTheDocument();
  });

  it('does not show View All button when onViewAll is not provided', () => {
    render(<TopItemsWidget title="Top Products" items={mockItems} />);
    expect(screen.queryByText('View All')).not.toBeInTheDocument();
  });
});
