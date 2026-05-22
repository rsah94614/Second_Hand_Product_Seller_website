import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { ReportsNavigation } from '../components/ReportsNavigation';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { DateRangePicker } from '../components/DateRangePicker';
import { comparePeriods, exportReportPDF, downloadProtectedFile } from '../api/adminApi';
import {
  formatCurrency,
  formatNumberWithSeparators,
  formatPercentage,
  getPresetDateRange,
} from '../../../lib/formatting';

export default function PeriodComparisonPage() {
  // Period 1 (Current)
  const [period1Start, setPeriod1Start] = useState(() => {
    const { startDate } = getPresetDateRange('30d');
    return startDate;
  });
  const [period1End, setPeriod1End] = useState(() => {
    const { endDate } = getPresetDateRange('30d');
    return endDate;
  });

  // Period 2 (Previous)
  const [period2Start, setPeriod2Start] = useState(() => {
    const { startDate } = getPresetDateRange('30d');
    const prevStart = new Date(startDate);
    prevStart.setDate(prevStart.getDate() - 30);
    return prevStart;
  });
  const [period2End, setPeriod2End] = useState(() => {
    const { startDate } = getPresetDateRange('30d');
    const prevEnd = new Date(startDate);
    prevEnd.setDate(prevEnd.getDate() - 1);
    return prevEnd;
  });

  const comparisonParams = {
    period1Start: period1Start.toISOString().split('T')[0],
    period1End: period1End.toISOString().split('T')[0],
    period2Start: period2Start.toISOString().split('T')[0],
    period2End: period2End.toISOString().split('T')[0],
  };

  const comparisonQuery = useQuery({
    queryKey: ['period-comparison', comparisonParams],
    queryFn: () => comparePeriods(comparisonParams),
    staleTime: 30000,
  });

  const handleRefresh = () => {
    comparisonQuery.refetch();
  };

  const handleExportPDF = async () => {
    try {
      const response = await exportReportPDF({
        reportType: 'comparison',
        startDate: comparisonParams.period1Start,
        endDate: comparisonParams.period1End,
      });

      await downloadProtectedFile(response.downloadUrl, response.fileName);

      toast.success('Report exported successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to export report');
    }
  };

  const comparison = comparisonQuery.data || {};
  const metrics = comparison.metrics || {};
  // Comparison Metric Card Component
  const ComparisonMetricCard = ({ title, period1Value, period2Value, type = 'currency' }) => {
    const absoluteChange = period1Value - period2Value;
    const percentageChange = period2Value !== 0 
      ? ((period1Value - period2Value) / period2Value) * 100 
      : 0;
    const isPositive = absoluteChange >= 0;

    const formatValue = (value) => {
      switch (type) {
        case 'currency':
          return formatCurrency(value);
        case 'percentage':
          return formatPercentage(value, 1);
        case 'count':
          return formatNumberWithSeparators(value, 0);
        default:
          return formatNumberWithSeparators(value, 0);
      }
    };

    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm font-medium text-gray-600 mb-4">{title}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Current Period</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatValue(period1Value)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Previous Period</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatValue(period2Value)}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Change</p>
                <p className={`text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{formatValue(absoluteChange)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">% Change</p>
                <div className="flex items-center justify-end gap-1">
                  {isPositive ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-600" />
                  )}
                  <p className={`text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{formatPercentage(percentageChange, 1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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
              <h1 className="text-4xl font-bold text-gray-900 mt-2">Period Comparison</h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Compare metrics across two time periods to identify trends and growth patterns.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={comparisonQuery.isLoading}
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

        {/* Date Range Pickers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Period</h3>
            <DateRangePicker
              startDate={period1Start}
              endDate={period1End}
              onDateRangeChange={(start, end) => {
                setPeriod1Start(start);
                setPeriod1End(end);
              }}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Previous Period</h3>
            <DateRangePicker
              startDate={period2Start}
              endDate={period2End}
              onDateRangeChange={(start, end) => {
                setPeriod2Start(start);
                setPeriod2End(end);
              }}
            />
          </div>
        </div>

        {/* Error State */}
        {comparisonQuery.isError && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Failed to load data</h3>
                  <p className="text-sm text-red-700 mt-1">
                    There was an error loading the comparison data. Please try refreshing.
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
        {comparisonQuery.isLoading && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                <p className="text-gray-600">Loading comparison data...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison Metrics */}
        {!comparisonQuery.isLoading && metrics.revenue !== undefined && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <ComparisonMetricCard
                title="Total Revenue"
                period1Value={metrics.revenue?.period1 || 0}
                period2Value={metrics.revenue?.period2 || 0}
                type="currency"
              />
              <ComparisonMetricCard
                title="Sales Volume"
                period1Value={metrics.salesVolume?.period1 || 0}
                period2Value={metrics.salesVolume?.period2 || 0}
                type="count"
              />
              <ComparisonMetricCard
                title="Average Order Value"
                period1Value={metrics.avgOrderValue?.period1 || 0}
                period2Value={metrics.avgOrderValue?.period2 || 0}
                type="currency"
              />
              <ComparisonMetricCard
                title="Payment Success Rate"
                period1Value={metrics.successRate?.period1 || 0}
                period2Value={metrics.successRate?.period2 || 0}
                type="percentage"
              />
              <ComparisonMetricCard
                title="Active Sellers"
                period1Value={metrics.activeSellers?.period1 || 0}
                period2Value={metrics.activeSellers?.period2 || 0}
                type="count"
              />
            </div>

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Comparison Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Current Period</p>
                      <p className="text-sm text-gray-600">
                        {comparisonParams.period1Start} to {comparisonParams.period1End}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">
                        {formatCurrency(metrics.revenue?.period1 || 0)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatNumberWithSeparators(metrics.salesVolume?.period1 || 0, 0)} orders
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Previous Period</p>
                      <p className="text-sm text-gray-600">
                        {comparisonParams.period2Start} to {comparisonParams.period2End}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(metrics.revenue?.period2 || 0)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatNumberWithSeparators(metrics.salesVolume?.period2 || 0, 0)} orders
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-600 mb-3">Key Insights</p>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>
                          Revenue {(metrics.revenue?.period1 || 0) > (metrics.revenue?.period2 || 0) ? 'increased' : 'decreased'} by{' '}
                          {formatPercentage(
                            ((metrics.revenue?.period1 || 0) - (metrics.revenue?.period2 || 0)) /
                              (metrics.revenue?.period2 || 1) * 100,
                            1
                          )}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>
                          Sales volume {(metrics.salesVolume?.period1 || 0) > (metrics.salesVolume?.period2 || 0) ? 'increased' : 'decreased'} by{' '}
                          {formatPercentage(
                            ((metrics.salesVolume?.period1 || 0) - (metrics.salesVolume?.period2 || 0)) /
                              (metrics.salesVolume?.period2 || 1) * 100,
                            1
                          )}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>
                          Average order value {(metrics.avgOrderValue?.period1 || 0) > (metrics.avgOrderValue?.period2 || 0) ? 'increased' : 'decreased'} by{' '}
                          {formatPercentage(
                            ((metrics.avgOrderValue?.period1 || 0) - (metrics.avgOrderValue?.period2 || 0)) /
                              (metrics.avgOrderValue?.period2 || 1) * 100,
                            1
                          )}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!comparisonQuery.isLoading && !metrics.revenue && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No comparison data found for the selected periods.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
