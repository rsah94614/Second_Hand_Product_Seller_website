import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Users,
  CreditCard,
  Layers,
  ArrowLeftRight,
  Home,
} from 'lucide-react';

/**
 * ReportsNavigation Component
 * Provides navigation between different report views
 */
export function ReportsNavigation() {
  const location = useLocation();

  const reportLinks = [
    {
      label: 'Dashboard',
      description: 'Overview of key metrics',
      to: '/admin/sales-dashboard',
      icon: Home,
    },
    {
      label: 'Top Products',
      description: 'Best-selling products',
      to: '/admin/reports/top-products',
      icon: ShoppingCart,
    },
    {
      label: 'Categories',
      description: 'Revenue by category',
      to: '/admin/reports/categories',
      icon: Layers,
    },
    {
      label: 'Sales Trends',
      description: 'Revenue trends over time',
      to: '/admin/reports/trends',
      icon: TrendingUp,
    },
    {
      label: 'Seller Rankings',
      description: 'Top performing sellers',
      to: '/admin/reports/sellers',
      icon: Users,
    },
    {
      label: 'Payment Metrics',
      description: 'Payment success rates',
      to: '/admin/reports/payments',
      icon: CreditCard,
    },
    {
      label: 'Transactions',
      description: 'Order value analysis',
      to: '/admin/reports/transactions',
      icon: BarChart3,
    },
    {
      label: 'Comparison',
      description: 'Period-over-period analysis',
      to: '/admin/reports/comparison',
      icon: ArrowLeftRight,
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sales & Revenue Reports</h2>
        <p className="text-sm text-gray-600 mt-1">
          Comprehensive business intelligence and analytics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {reportLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.to);

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`group relative rounded-xl p-4 transition-all duration-300 ${
                active
                  ? 'bg-blue-50 border border-blue-200 shadow-md'
                  : 'bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600 group-hover:bg-blue-600 group-hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold ${active ? 'text-blue-900' : 'text-gray-900'}`}>
                    {link.label}
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">
                    {link.description}
                  </p>
                </div>
              </div>
              {active && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default ReportsNavigation;
