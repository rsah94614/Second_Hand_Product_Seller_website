import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  CreditCard,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { ReportsNavigation } from '../components/ReportsNavigation';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { DateRangePicker } from '../components/DateRangePicker';
import { getPaymentMetrics, exportReportPDF, downloadProtectedFile } from '../api/adminApi';
import {
  formatNumberWithSeparators,
  formatPercentage,
  getPresetDateRange,
} from '../../../lib/formatting';

export default function PaymentMetricsPage() {
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

  const metricsQuery = useQuery({
    queryKey: ['payment-metrics', dateParams],
    queryFn: () => getPaymentMetrics(dateParams),
    staleTime: 30000,
  });

  const handleRefresh = () => {
    metricsQuery.refetch();
  };

  const handleExportPDF = async () => {
    try {
      const response = await exportReportPDF({
        reportType: 'payments',
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
  const successRate = metrics.successRate || 0;
  const failureRate = metrics.failureRate || 0;
  const failureBreakdown = metrics.failureBreakdown || [];

  const isLowSuccessRate = successRate < 95;

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
              <h1 className="text-4xl font-bold text-gray-900 mt-2">Payment Metrics</h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Monitor payment success rates, failures, and transaction reliability.
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
        {metricsQuery.isError && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Failed to load data</h3>
                  <p className="text-sm text-red-700 mt-1">
                    There was an error loading the payment metrics. Please try refreshing.
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
        {metricsQuery.isLoading && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                <p className="text-gray-600">Loading payment metrics...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Warning Alert */}
        {!metricsQuery.isLoading && isLowSuccessRate && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Low Payment Success Rate</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Payment success rate is {formatPercentage(successRate, 1)}, which is below the recommended 95% threshold. Please investigate payment processing issues.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        {!metricsQuery.isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Attempts */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatNumberWithSeparators(metrics.totalAttempts || 0, 0)}
                    </p>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            {/* Successful Payments */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Successful</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">
                      {formatNumberWithSeparators(metrics.successfulPayments || 0, 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatPercentage(successRate, 1)}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            {/* Failed Payments */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Failed</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      {formatNumberWithSeparators(metrics.failedPayments || 0, 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatPercentage(failureRate, 1)}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            {/* Success Rate */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p
                      className={`text-3xl font-bold mt-2 ${
                        successRate >= 95 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {formatPercentage(successRate, 1)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Failure Breakdown */}
        {!metricsQuery.isLoading && failureBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Failure Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {failureBreakdown.map((item, index) => {
                  const percentage = metrics.failedPayments > 0 
                    ? (item.count / metrics.failedPayments) * 100 
                    : 0;
                  
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{item.status}</p>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatNumberWithSeparators(item.count, 0)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatPercentage(percentage, 1)}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!metricsQuery.isLoading && !metrics.totalAttempts && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No payment data found for the selected date range.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
