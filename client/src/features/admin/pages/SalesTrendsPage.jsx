import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  Download,
  RefreshCw,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import AdminHeader from '../../../components/AdminHeader';
import Footer from '../../../components/Footer';
import { ReportsNavigation } from '../components/ReportsNavigation';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { DateRangePicker } from '../components/DateRangePicker';
import { RevenueChart } from '../components/RevenueChart';
import { getSalesTrends, exportReportPDF, downloadProtectedFile } from '../api/adminApi';
import {
  formatCurrency,
  formatNumberWithSeparators,
  formatPercentage,
  getPresetDateRange,
} from '../../../lib/formatting';

export default function SalesTrendsPage() {
  const [startDate, setStartDate] = useState(() => {
    const { startDate } = getPresetDateRange('30d');
    return startDate;
  });
  const [endDate, setEndDate] = useState(() => {
    const { endDate } = getPresetDateRange('30d');
    return endDate;
  });
  const [granularity, setGranularity] = useState('daily');

  const dateParams = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    granularity,
  };

  const trendsQuery = useQuery({
    queryKey: ['sales-trends', dateParams],
    queryFn: () => getSalesTrends(dateParams),
    staleTime: 30000,
  });

  const handleRefresh = () => {
    trendsQuery.refetch();
  };

  const handleExportPDF = async () => {
    try {
      const response = await exportReportPDF({
        reportType: 'trends',
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
      });

      await downloadProtectedFile(response.downloadUrl, response.fileName);

      toast.success('Report exported successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to export report');
    }
  };

  const trends = trendsQuery.data?.trends || [];
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ReportsNavigation />
        {/* Header Section */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">
                Reports
              </p>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">Sales Trends</h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Track revenue, sales volume, and order value trends over time with period-over-period comparisons.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={trendsQuery.isLoading}
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

        {/* Date Range and Granularity */}
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

          {/* Granularity Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Granularity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {trendsQuery.isError && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Failed to load data</h3>
                  <p className="text-sm text-red-700 mt-1">
                    There was an error loading the sales trends. Please try refreshing.
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

        {/* Chart */}
        {!trendsQuery.isLoading && trends.length > 0 && (
          <div className="mb-8">
            <RevenueChart data={trends} loading={trendsQuery.isLoading} />
          </div>
        )}

        {/* Loading State */}
        {trendsQuery.isLoading && (
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                <p className="text-gray-600">Loading sales trends...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trends Table */}
        {!trendsQuery.isLoading && trends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Detailed Trends ({granularity.charAt(0).toUpperCase() + granularity.slice(1)})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Period</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Sales Volume
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Avg Order Value
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Transactions
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Period Change
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((trend, index) => {
                      const changePercent = trend.change || 0;
                      const isPositive = changePercent >= 0;
                      
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900">{trend.date}</p>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-emerald-600">
                              {formatCurrency(trend.revenue)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-gray-900">
                              {formatNumberWithSeparators(trend.salesVolume, 0)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(trend.avgOrderValue)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-gray-900">
                              {formatNumberWithSeparators(trend.transactions, 0)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`font-semibold ${
                                isPositive ? 'text-emerald-600' : 'text-red-600'
                              }`}
                            >
                              {isPositive ? '+' : ''}{formatPercentage(changePercent, 1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!trendsQuery.isLoading && trends.length === 0 && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No trends data found for the selected date range.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
