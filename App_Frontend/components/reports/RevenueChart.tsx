import { View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";

interface ChartDataPoint {
  date: string;
  revenue: number;
}

interface RevenueChartProps {
  data: ChartDataPoint[];
  title?: string;
  loading?: boolean;
}

export function RevenueChart({ data, title = "30-Day Revenue Trend", loading = false }: RevenueChartProps) {
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 32; // Account for padding

  if (loading) {
    return (
      <View className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
        <Text className="text-[14px] font-outfit-sb text-slate-900 dark:text-white mb-4">
          {title}
        </Text>
        <View className="h-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
        <Text className="text-[14px] font-outfit-sb text-slate-900 dark:text-white mb-4">
          {title}
        </Text>
        <View className="h-64 items-center justify-center">
          <Text className="text-[14px] font-outfit text-slate-500 dark:text-slate-400">
            No data available
          </Text>
        </View>
      </View>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: data.map((d) => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: data.map((d) => d.revenue),
        color: () => "#3b82f6",
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden">
      <Text className="text-[14px] font-outfit-sb text-slate-900 dark:text-white mb-4">
        {title}
      </Text>
      <LineChart
        data={chartData}
        width={chartWidth - 8}
        height={256}
        chartConfig={{
          backgroundColor: "#ffffff",
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          decimalPlaces: 0,
          color: () => "#e2e8f0",
          labelColor: () => "#94a3b8",
          style: {
            borderRadius: 8,
          },
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#3b82f6",
          },
          propsForBackgroundLines: {
            strokeDasharray: "0",
            stroke: "#e2e8f0",
          },
        }}
        bezier
        style={{
          borderRadius: 8,
        }}
      />
    </View>
  );
}
