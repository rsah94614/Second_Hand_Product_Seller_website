import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  ShoppingCart,
  Calculator,
  Users,
  Download,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { ReportsNavigation } from '../components/ReportsNavigation';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { ErrorState } from '../../../components/ui/ErrorState';
import { MetricCard } from '../components/MetricCard';
import { DateRangePicker } from '../components/DateRangePicker';
import { RevenueChart } from '../components/RevenueChart';
import { TopItemsWidget } from '../components/TopItemsWidget';
import { CategoryBreakdownWidget } from '../components/CategoryBreakdownWidget';
import {
  getDashboardMetrics,
  getTopProducts,
  getCategoryBreakdown,
  getSalesTrends,
  getSellerRankings,
  exportReportPDF,
  downloadProtectedFile,
} from '../api/adminApi';
import {
  formatCurrency,
  formatNumberWithSeparators,
  getPresetDateRange,
} from '../../../lib/formatting';

export default function SalesDashboardPage() {
  const [startDate, setStartDate] = useState(() => {
    const { startDate } = getPresetDateRange('30d');
    return startDate;
  });
  const [endDate, setEndDate] = useState(() => {
    const { endDate } = getPresetDateRange('30d');
    return endDate;
  });

  const dateParams = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };

  // Fetch dashboard metrics
  const metricsQuery = useQuery({
    queryKey: ['dashboard-metrics', dateParams],
    queryFn: () => getDashboardMetrics(dateParams),
    staleTime: 30000,
  });

  // Fetch top products
  const topProductsQuery = useQuery({
    queryKey: ['top-products', dateParams],
    queryFn: () => getTopProducts({ ...dateParams, limit: '5' }),
    staleTime: 30000,
  });

  // Fetch category breakdown
  const categoryQuery = useQuery({
    queryKey: ['category-breakdown', dateParams],
    queryFn: () => getCategoryBreakdown(dateParams),
    staleTime: 30000,
  });

  // Fetch sales trends
  const trendsQuery = useQuery({
    queryKey: ['sales-trends', dateParams],
    queryFn: () => getSalesTrends({ ...dateParams, granularity: 'daily' }),
    staleTime: 30000,
  });

  // Fetch seller rankings
  const sellersQuery = useQuery({
    queryKey: ['seller-rankings', dateParams],
    queryFn: () => getSellerRankings({ ...dateParams, limit: '5' }),
    staleTime: 30000,
  });

  const isLoading =
    metricsQuery.isLoading ||
    topProductsQuery.isLoading ||
    categoryQuery.isLoading ||
    trendsQuery.isLoading ||
    sellersQuery.isLoading;

  const handleRefresh = () => {
    metricsQuery.refetch();
    topProductsQuery.refetch();
    categoryQuery.refetch();
    trendsQuery.refetch();
    sellersQuery.refetch();
  };

  const handleExportPDF = async () => {
    try {
      const payload = {
        reportType: 'dashboard',
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
      };
      console.log('Exporting PDF with payload:', payload);
      
      const response = await exportReportPDF(payload);

      await downloadProtectedFile(response.downloadUrl, response.fileName);

      toast.success('Report exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(error.response?.data?.message || 'Failed to export report');
    }
  };

  const metrics = metricsQuery.data || {};
  const topProducts = topProductsQuery.data?.products || [];
  const categories = categoryQuery.data?.categories || [];
  const trends = trendsQuery.data?.trends || [];
  const sellers = sellersQuery.data?.sellers || [];

  const hasError =
    metricsQuery.isError ||
    topProductsQuery.isError ||
    categoryQuery.isError ||
    trendsQuery.isError ||
    sellersQuery.isError;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ReportsNavigation />
        {/* Header Section */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
                Analytics
              </p>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">Sales Dashboard</h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Monitor your platform's sales performance, revenue trends, and seller metrics in
                real-time.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button size="sm" onClick={handleExportPDF} className="gap-2">
                <Download className="w-4 h-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </section>

        {/* Date Range Picker */}
        <div className="mb-8">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        </div>

        {/* Error State */}
        {hasError && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Failed to load data</h3>
                  <p className="text-sm text-red-700 mt-1">
                    There was an error loading the dashboard. Please try refreshing the page.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="mt-3 gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(metrics.totalRevenue || 0)}
            icon={TrendingUp}
            change={metrics.revenueChange}
            loading={metricsQuery.isLoading}
          />
          <MetricCard
            title="Sales Volume"
            value={formatNumberWithSeparators(metrics.salesVolume || 0, 0)}
            icon={ShoppingCart}
            change={metrics.volumeChange}
            loading={metricsQuery.isLoading}
          />
          <MetricCard
            title="Avg Order Value"
            value={formatCurrency(metrics.avgOrderValue || 0)}
            icon={Calculator}
            change={metrics.aovChange}
            loading={metricsQuery.isLoading}
          />
          <MetricCard
            title="Active Sellers"
            value={formatNumberWithSeparators(metrics.activeSellers || 0, 0)}
            icon={Users}
            change={metrics.sellersChange}
            loading={metricsQuery.isLoading}
          />
        </div>

        {/* Revenue Trend Chart */}
        <div className="mb-8">
          <RevenueChart data={trends} loading={trendsQuery.isLoading} />
        </div>

        {/* Top Products and Sellers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <TopItemsWidget
            title="Top 5 Products"
            items={topProducts.map((product, index) => ({
              id: product._id || product.id,
              title: product.title,
              subtitle: product.category,
              value: product.revenue,
              valueLabel: `${product.quantitySold} sold`,
              rank: index + 1,
              icon: ShoppingCart,
            }))}
            loading={topProductsQuery.isLoading}
          />

          <TopItemsWidget
            title="Top 5 Sellers"
            items={sellers.map((seller, index) => ({
              id: seller._id || seller.id,
              title: seller.sellerName,
              subtitle: `${seller.completedOrders} orders`,
              value: seller.totalRevenue,
              valueLabel: `₹${seller.avgOrderValue.toFixed(0)} avg`,
              rank: index + 1,
              icon: Users,
            }))}
            loading={sellersQuery.isLoading}
          />
        </div>

        {/* Category Breakdown */}
        <div className="mb-8">
          <CategoryBreakdownWidget
            categories={categories}
            loading={categoryQuery.isLoading}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
