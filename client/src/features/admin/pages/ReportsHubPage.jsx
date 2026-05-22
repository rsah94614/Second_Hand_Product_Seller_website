import React from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Users,
  CreditCard,
  Layers,
  ArrowLeftRight,
  Home,
  ArrowRight,
} from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Button } from '../../../components/ui/Button';

/**
 * ReportsHubPage
 * Central hub for accessing all Sales & Revenue Reports
 */
export default function ReportsHubPage() {
  const reportCategories = [
    {
      title: 'Dashboard',
      description: 'Get a quick overview of your platform\'s key metrics and performance indicators.',
      icon: Home,
      to: '/admin/sales-dashboard',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Top Products',
      description: 'Identify your best-selling products ranked by quantity, revenue, or rating.',
      icon: ShoppingCart,
      to: '/admin/reports/top-products',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Category Breakdown',
      description: 'Analyze revenue distribution and sales performance across product categories.',
      icon: Layers,
      to: '/admin/reports/categories',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Sales Trends',
      description: 'Track revenue, sales volume, and order value trends over time with daily, weekly, or monthly granularity.',
      icon: TrendingUp,
      to: '/admin/reports/trends',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Seller Rankings',
      description: 'Rank sellers by revenue, orders, ratings, or average order value to identify top performers.',
      icon: Users,
      to: '/admin/reports/sellers',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'Payment Metrics',
      description: 'Monitor payment success rates, failures, and transaction reliability with detailed breakdowns.',
      icon: CreditCard,
      to: '/admin/reports/payments',
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: 'Transaction Metrics',
      description: 'Analyze order value distribution, statistics, and patterns across your platform.',
      icon: BarChart3,
      to: '/admin/reports/transactions',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Period Comparison',
      description: 'Compare metrics across two time periods to identify trends and growth patterns.',
      icon: ArrowLeftRight,
      to: '/admin/reports/comparison',
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Section */}
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-12">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600 mb-2">
              Analytics & Insights
            </p>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Sales & Revenue Reports
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Comprehensive business intelligence to monitor your platform's sales performance, revenue trends, and seller metrics in real-time. Make data-driven decisions with detailed analytics and insights.
            </p>
          </div>
        </section>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">Available Reports</p>
            <p className="text-3xl font-bold text-gray-900">8</p>
            <p className="text-xs text-gray-500 mt-2">Comprehensive analytics views</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">Data Refresh</p>
            <p className="text-3xl font-bold text-gray-900">Real-time</p>
            <p className="text-xs text-gray-500 mt-2">Updated within 2 seconds</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <p className="text-sm font-medium text-gray-600 mb-2">Export Options</p>
            <p className="text-3xl font-bold text-gray-900">PDF</p>
            <p className="text-xs text-gray-500 mt-2">Download reports as PDF</p>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reportCategories.map((report) => {
            const Icon = report.icon;

            return (
              <Link
                key={report.to}
                to={report.to}
                className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Background gradient */}
                <div className={`absolute top-0 right-0 w-32 h-32 ${report.bgColor} rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                {/* Content */}
                <div className="relative p-6">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl bg-linear-to-br ${report.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {report.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {report.description}
                  </p>

                  {/* Arrow */}
                  <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm group-hover:gap-3 transition-all duration-300">
                    <span>View Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Features Section */}
        <section className="mt-16 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4 font-bold">
                📊
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-time Data</h3>
              <p className="text-sm text-gray-600">
                All reports update within 2 seconds with the latest data from your platform.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 font-bold">
                🎯
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Flexible Filtering</h3>
              <p className="text-sm text-gray-600">
                Filter by date range with preset options (7, 30, 90, 365 days) or custom dates.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-4 font-bold">
                📈
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Sorting & Ranking</h3>
              <p className="text-sm text-gray-600">
                Sort by multiple criteria to identify top performers and trends in your data.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mb-4 font-bold">
                📥
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">PDF Export</h3>
              <p className="text-sm text-gray-600">
                Download any report as a PDF for sharing, archiving, or further analysis.
              </p>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section className="mt-12 bg-linear-to-r from-blue-600 to-blue-700 rounded-3xl p-8 text-white">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
            <p className="text-blue-100 mb-6">
              Start by viewing the Sales Dashboard for a quick overview of your platform's performance. Then explore individual reports to dive deeper into specific metrics and trends.
            </p>
            <Link to="/admin/sales-dashboard">
              <Button className="bg-white text-blue-600 hover:bg-blue-50">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
