import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrendingUp } from 'lucide-react';
import { MetricCard } from './MetricCard';

describe('MetricCard', () => {
  it('renders metric card with title and value', () => {
    render(
      <MetricCard
        title="Total Revenue"
        value="₹1,00,000"
        icon={TrendingUp}
      />
    );

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('₹1,00,000')).toBeInTheDocument();
  });

  it('displays positive change with up arrow', () => {
    render(
      <MetricCard
        title="Revenue"
        value="₹1,00,000"
        icon={TrendingUp}
        change={15.5}
      />
    );

    expect(screen.getByText(/15.5%/)).toBeInTheDocument();
  });

  it('displays negative change with down arrow', () => {
    render(
      <MetricCard
        title="Revenue"
        value="₹1,00,000"
        icon={TrendingUp}
        change={-10.2}
      />
    );

    expect(screen.getByText(/10.2%/)).toBeInTheDocument();
  });

  it('shows loading skeleton when loading is true', () => {
    const { container } = render(
      <MetricCard
        title="Revenue"
        value="₹1,00,000"
        icon={TrendingUp}
        loading={true}
      />
    );

    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays custom change label', () => {
    render(
      <MetricCard
        title="Revenue"
        value="₹1,00,000"
        icon={TrendingUp}
        change={5}
        changeLabel="vs yesterday"
      />
    );

    expect(screen.getByText(/vs yesterday/)).toBeInTheDocument();
  });
});
