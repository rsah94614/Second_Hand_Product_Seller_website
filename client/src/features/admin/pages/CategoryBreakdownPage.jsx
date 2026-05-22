import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Layers,
  Download,
  RefreshCw,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { ReportsNavigation } from '../components/ReportsNavigation';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { DateRangePicker } from '../components/DateRangePicker';
import { getCategoryBreakdown, exportReportPDF, downloadProtectedFile } from '../api/adminApi';
import {
  formatCurrency,
  formatNumberWithSeparators,
  formatPercentage,
  getPresetDateRange,
} from '../../../lib/formatting';

export default function CategoryBreakdownPage() {
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

  const categoriesQuery = useQuery({
    queryKey: ['category-breakdown', dateParams],
    queryFn: () => getCategoryBreakdown(dateParams),
    staleTime: 30000,
  });

  const handleRefresh = () => {
    categoriesQuery.refetch();
  };

  const handleExportPDF = async () => {
    try {
      const response = await exportReportPDF({
        reportType: 'categories',
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
      });

      await downloadProtectedFile(response.downloadUrl, response.fileName);

      toast.success('Report exported successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to export report');
    }
  };

  const categories = categoriesQuery.data?.categories || [];
  const totalRevenue = categories.reduce((sum, cat) => sum + (cat.revenue || 0), 0);

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
                Reports
              </p>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">Category Breakdown</h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Analyze revenue distribution and sales performance across product categories.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={categoriesQuery.isLoading}
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
        {categoriesQuery.isError && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Failed to load data</h3>
                  <p className="text-sm text-red-700 mt-1">
                    There was an error loading the category breakdown. Please try refreshing.
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

        {/* Loading State */}
        {categoriesQuery.isLoading && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                <p className="text-gray-600">Loading category breakdown...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories Table */}
        {!categoriesQuery.isLoading && categories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Category Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        % of Total
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Sales Volume
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Avg Order Value
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Active Sellers
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, index) => {
                      const percentOfTotal = totalRevenue > 0 
                        ? (category.revenue / totalRevenue) * 100 
                        : 0;
                      
                      return (
                        <tr key={category._id || index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900">{category.category}</p>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-emerald-600">
                              {formatCurrency(category.revenue)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(percentOfTotal, 100)}%` }}
                                />
                              </div>
                              <span className="font-semibold text-gray-900 w-12 text-right">
                                {formatPercentage(percentOfTotal, 1)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-gray-900">
                              {formatNumberWithSeparators(category.salesVolume, 0)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(category.avgOrderValue)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-gray-900">
                              {formatNumberWithSeparators(category.activeSellers, 0)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Row */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Total Revenue</p>
                    <p className="text-lg font-bold text-emerald-600 mt-1">
                      {formatCurrency(totalRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Total Volume</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {formatNumberWithSeparators(
                        categories.reduce((sum, cat) => sum + (cat.salesVolume || 0), 0),
                        0
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Categories</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {formatNumberWithSeparators(categories.length, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Avg AOV</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {formatCurrency(
                        totalRevenue / categories.reduce((sum, cat) => sum + (cat.salesVolume || 0), 0) || 0
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!categoriesQuery.isLoading && categories.length === 0 && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No categories found for the selected date range.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
