import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  BarChart3,
  Download,
  RefreshCw,
  AlertCircle,
  Filter,
} from 'lucide-react';
import AdminHeader from '../../../components/AdminHeader';
import Footer from '../../../components/Footer';
import { ReportsNavigation } from '../components/ReportsNavigation';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { DateRangePicker } from '../components/DateRangePicker';
import { getTransactionMetrics, getCategoryBreakdown, exportReportPDF, downloadProtectedFile } from '../api/adminApi';
import {
  formatCurrency,
  formatNumberWithSeparators,
  getPresetDateRange,
} from '../../../lib/formatting';

const PRICE_RANGES = [
  { key: '0-500', label: 'Rs 0 - Rs 500' },
  { key: '501-1000', label: 'Rs 501 - Rs 1,000' },
  { key: '1001-2500', label: 'Rs 1,001 - Rs 2,500' },
  { key: '2501-5000', label: 'Rs 2,501 - Rs 5,000' },
  { key: '5001-10000', label: 'Rs 5,001 - Rs 10,000' },
  { key: '10001+', label: 'Rs 10,001+' },
];

export default function TransactionMetricsPage() {
  const [startDate, setStartDate] = useState(() => {
    const { startDate } = getPresetDateRange('30d');
    return startDate;
  });
  const [endDate, setEndDate] = useState(() => {
    const { endDate } = getPresetDateRange('30d');
    return endDate;
  });
  const [selectedCategory, setSelectedCategory] = useState('all');

  const dateParams = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    ...(selectedCategory !== 'all' && { category: selectedCategory }),
  };

  const metricsQuery = useQuery({
    queryKey: ['transaction-metrics', dateParams],
    queryFn: () => getTransactionMetrics(dateParams),
    staleTime: 30000,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories-for-filter', dateParams.startDate, dateParams.endDate],
    queryFn: () => getCategoryBreakdown({ startDate: dateParams.startDate, endDate: dateParams.endDate }),
    staleTime: 60000,
  });

  const handleRefresh = () => {
    metricsQuery.refetch();
    categoriesQuery.refetch();
  };

  const handleExportPDF = async () => {
    try {
      const response = await exportReportPDF({
        reportType: 'transactions',
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
      });

      await downloadProtectedFile(response.downloadUrl, response.fileName);

      toast.success('Report exported successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to export report');
    }
  };

  const metrics = metricsQuery.data || {};
  const categories = categoriesQuery.data?.categories || [];
  const distributionMap = metrics.distribution || {};
  const distribution = PRICE_RANGES.map((range) => ({
    ...range,
    count: distributionMap[range.key] || 0,
  }));
  const maxDistribution = Math.max(...distribution.map((item) => item.count || 0), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ReportsNavigation />
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
                Reports
              </p>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">Transaction Metrics</h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Analyze order values, distribution patterns, and transaction statistics.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={metricsQuery.isLoading}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Category Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((cat, index) => (
                  <option
                    key={cat._id || cat.category || `category-${index}`}
                    value={cat.category}
                  >
                    {cat.category}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
        </div>

        {metricsQuery.isError && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Failed to load data</h3>
                  <p className="text-sm text-red-700 mt-1">
                    There was an error loading the transaction metrics. Please try refreshing.
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

        {metricsQuery.isLoading && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                <p className="text-gray-600">Loading transaction metrics...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!metricsQuery.isLoading && metrics.totalTransactions > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatCurrency(metrics.avgOrderValue)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Median Order Value</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatCurrency(metrics.medianOrderValue)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatNumberWithSeparators(metrics.totalTransactions, 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Minimum Order Value</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatCurrency(metrics.minOrderValue)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Maximum Order Value</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatCurrency(metrics.maxOrderValue)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Standard Deviation</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {formatCurrency(metrics.stdDeviation)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Order Value Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {distribution.map((distItem) => (
                    <div key={distItem.key}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{distItem.label}</p>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatNumberWithSeparators(distItem.count, 0)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {((distItem.count / (metrics.totalTransactions || 1)) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{
                            width: `${(distItem.count / maxDistribution) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!metricsQuery.isLoading && !metrics.totalTransactions && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No transaction data found for the selected date range.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
