import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FlatList, View, Text, Pressable, RefreshControl, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { MetricCard } from "../../components/reports/MetricCard";
import { DateRangePicker } from "../../components/reports/DateRangePicker";
import { RevenueChart } from "../../components/reports/RevenueChart";
import { TopItemsWidget } from "../../components/reports/TopItemsWidget";
import { CategoryBreakdownWidget } from "../../components/reports/CategoryBreakdownWidget";
import {
  getDashboardMetrics,
  getTopProducts,
  getCategoryBreakdown,
  getSalesTrends,
  getSellerRankings,
  exportReportPDF,
} from "../../lib/api/admin";
import {
  formatCurrency,
  formatNumberWithSeparators,
  getPresetDateRange,
} from "../../lib/utils/formatting";


export default function SalesDashboardScreen() {
  const [startDate, setStartDate] = useState(() => {
    const { startDate } = getPresetDateRange("30d");
    return startDate;
  });
  const [endDate, setEndDate] = useState(() => {
    const { endDate } = getPresetDateRange("30d");
    return endDate;
  });

  const dateParams = {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };

  // Fetch dashboard metrics
  const metricsQuery = useQuery({
    queryKey: ["dashboard-metrics", dateParams],
    queryFn: () => getDashboardMetrics(dateParams),
    staleTime: 30000, // 30 seconds
  });

  // Fetch top products
  const topProductsQuery = useQuery({
    queryKey: ["top-products", dateParams],
    queryFn: () => getTopProducts({ ...dateParams, limit: "5" }),
    staleTime: 30000,
  });

  // Fetch category breakdown
  const categoryQuery = useQuery({
    queryKey: ["category-breakdown", dateParams],
    queryFn: () => getCategoryBreakdown(dateParams),
    staleTime: 30000,
  });

  // Fetch sales trends
  const trendsQuery = useQuery({
    queryKey: ["sales-trends", dateParams],
    queryFn: () => getSalesTrends({ ...dateParams, granularity: "daily" }),
    staleTime: 30000,
  });

  // Fetch seller rankings
  const sellersQuery = useQuery({
    queryKey: ["seller-rankings", dateParams],
    queryFn: () => getSellerRankings({ ...dateParams, limit: "5" }),
    staleTime: 30000,
  });

  const isLoading =
    metricsQuery.isLoading ||
    topProductsQuery.isLoading ||
    categoryQuery.isLoading ||
    trendsQuery.isLoading ||
    sellersQuery.isLoading;

  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportReportPDF({
        type: "sales-dashboard",
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
      });
      Alert.alert("Export Requested", "Your PDF report will be sent to your email shortly.");
    } catch {
      Alert.alert("Export Failed", "Could not generate the report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleRefresh = () => {
    metricsQuery.refetch();
    topProductsQuery.refetch();
    categoryQuery.refetch();
    trendsQuery.refetch();
    sellersQuery.refetch();
  };

  const metrics = metricsQuery.data || {};
  const topProducts = topProductsQuery.data?.products || [];
  const categories = categoryQuery.data?.categories || [];
  const trends = trendsQuery.data?.trends || [];
  const sellers = sellersQuery.data?.sellers || [];

  const renderContent = () => {
    if (isLoading && !metricsQuery.data) {
      return <Loading />;
    }

    return (
      <FlatList
        data={[{ id: "content" }]}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        renderItem={() => (
          <View className="gap-4">
            {/* Date Range Picker */}
            <View className="px-4">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onDateRangeChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                }}
              />
            </View>

            {/* Metric Cards */}
            <View className="px-4">
              <View className="flex-row gap-3 mb-3">
                <MetricCard
                  title="Revenue"
                  value={formatCurrency(metrics.totalRevenue || 0)}
                  icon="trending-up"
                  change={metrics.revenueChange}
                  loading={metricsQuery.isLoading}
                />
                <MetricCard
                  title="Orders"
                  value={formatNumberWithSeparators(metrics.salesVolume || 0, 0)}
                  icon="cart"
                  change={metrics.volumeChange}
                  loading={metricsQuery.isLoading}
                />
              </View>

              <View className="flex-row gap-3">
                <MetricCard
                  title="Avg Order"
                  value={formatCurrency(metrics.avgOrderValue || 0)}
                  icon="calculator"
                  change={metrics.aovChange}
                  loading={metricsQuery.isLoading}
                />
                <MetricCard
                  title="Sellers"
                  value={formatNumberWithSeparators(metrics.activeSellers || 0, 0)}
                  icon="people"
                  change={metrics.sellersChange}
                  loading={metricsQuery.isLoading}
                />
              </View>
            </View>

            {/* Revenue Trend Chart */}
            <View className="px-4">
              <RevenueChart data={trends} loading={trendsQuery.isLoading} />
            </View>

            {/* Top Products */}
            <View className="px-4">
              <TopItemsWidget
                title="Top 5 Products"
                items={topProducts.map((product: any, index: number) => ({
                  id: product._id || product.id,
                  title: product.title,
                  subtitle: product.category,
                  value: product.revenue,
                  valueLabel: `${product.quantitySold} sold`,
                  rank: index + 1,
                  icon: "cube",
                }))}
                loading={topProductsQuery.isLoading}
                onViewAll={() => router.push("/admin/products" as never)}
              />
            </View>

            {/* Top Sellers */}
            <View className="px-4">
              <TopItemsWidget
                title="Top 5 Sellers"
                items={sellers.map((seller: any, index: number) => ({
                  id: seller._id || seller.id,
                  title: seller.sellerName,
                  subtitle: `${seller.completedOrders} orders`,
                  value: seller.totalRevenue,
                  valueLabel: `₹${seller.avgOrderValue.toFixed(0)} avg`,
                  rank: index + 1,
                  icon: "storefront",
                }))}
                loading={sellersQuery.isLoading}
                onViewAll={() => router.push("/admin/users" as never)}
              />
            </View>

            {/* Category Breakdown */}
            <View className="px-4">
              <CategoryBreakdownWidget
                categories={categories}
                loading={categoryQuery.isLoading}
              />
            </View>

            {/* Export Button */}
            <View className="px-4 pb-4">
              <Pressable
                onPress={handleExportPDF}
                disabled={exporting}
                className={`flex-row items-center justify-center gap-2 px-4 py-3 rounded-xl ${exporting ? "bg-slate-300 dark:bg-slate-700" : "bg-primary-600"}`}
              >
                <Ionicons name="download" size={16} color="white" />
                <Text className="text-[14px] font-outfit-sb text-white">
                  {exporting ? "Generating PDF..." : "Export as PDF"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    );
  };

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950" safeAreaTop={false}>
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Text className="text-[20px] font-outfit-sb text-slate-900 dark:text-white">
          Sales Dashboard
        </Text>
        <Pressable onPress={handleRefresh} disabled={isLoading}>
          <Ionicons
            name="refresh"
            size={20}
            color={isLoading ? "#cbd5e1" : "#64748b"}
          />
        </Pressable>
      </View>

      {renderContent()}
    </Screen>
  );
}
