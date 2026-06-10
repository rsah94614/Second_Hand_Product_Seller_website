import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Users,
  Download,
  RefreshCw,
  AlertCircle,
  ArrowUpDown,
  Star,
  CheckCircle,
} from 'lucide-react';
import AdminHeader from '../../../components/AdminHeader';
import Footer from '../../../components/Footer';
import { ReportsNavigation } from '../components/ReportsNavigation';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { DateRangePicker } from '../components/DateRangePicker';
import { getSellerRankings, exportReportPDF, downloadProtectedFile } from '../api/adminApi';
import {
  formatCurrency,
  formatNumberWithSeparators,
  getPresetDateRange,
} from '../../../lib/formatting';

export default function SellerRankingsPage() {
  const [startDate, setStartDate] = useState(() => {
    const { startDate } = getPresetDateRange('30d');
    return startDate;
  });
  const [endDate, setEndDate] = useState(() => {
    const { endDate } = getPresetDateRange('30d');
    return endDate;
  });
  const [sortBy, setSortBy] = useState('revenue');
  const [limit] = useState(50);

  const dateParams = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    sortBy,
    limit: limit.toString(),
  };

  const sellersQuery = useQuery({
    queryKey: ['seller-rankings', dateParams],
    queryFn: () => getSellerRankings(dateParams),
    staleTime: 30000,
  });

  const handleRefresh = () => {
    sellersQuery.refetch();
  };

  const handleExportPDF = async () => {
    try {
      const response = await exportReportPDF({
        reportType: 'sellers',
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
      });

      await downloadProtectedFile(response.downloadUrl, response.fileName);

      toast.success('Report exported successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to export report');
    }
  };

  const sellers = sellersQuery.data?.sellers || [];

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
              <h1 className="text-4xl font-bold text-gray-900 mt-2">Seller Rankings</h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Rank sellers by revenue, orders, ratings, and average order value to identify top performers.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={sellersQuery.isLoading}
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

        {/* Date Range and Filters */}
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

          {/* Sort Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4" />
                Sort By
              </CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="revenue">Total Revenue</option>
                <option value="orders">Number of Orders</option>
                <option value="rating">Average Rating</option>
                <option value="aov">Average Order Value</option>
              </select>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {sellersQuery.isError && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Failed to load data</h3>
                  <p className="text-sm text-red-700 mt-1">
                    There was an error loading the seller rankings. Please try refreshing.
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
        {sellersQuery.isLoading && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                <p className="text-gray-600">Loading seller rankings...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sellers Table */}
        {!sellersQuery.isLoading && sellers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top {Math.min(sellers.length, limit)} Sellers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Seller Name</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Total Revenue
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Completed Orders
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Avg Order Value
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Rating</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Products
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">
                        Verified
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.map((seller, index) => (
                      <tr key={seller._id || index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{seller.sellerName}</p>
                          <p className="text-xs text-gray-500">{seller._id}</p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(seller.totalRevenue)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-gray-900">
                            {formatNumberWithSeparators(seller.completedOrders, 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(seller.avgOrderValue)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold text-gray-900">
                              {seller.avgRating?.toFixed(1) || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {formatNumberWithSeparators(seller.activeProducts, 0)}
                            </p>
                            <p className="text-xs text-gray-500">
                              of {formatNumberWithSeparators(seller.productsListed, 0)}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {seller.verificationStatus === 'verified' ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!sellersQuery.isLoading && sellers.length === 0 && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No sellers found for the selected date range.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
