import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getTrendColor, getTrendBgColor, getTrendIndicator } from "../../lib/utils/formatting";

interface MetricCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  change?: number;
  changeLabel?: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  icon,
  change,
  changeLabel = "vs last period",
  loading = false,
}: MetricCardProps) {
  const trend = change !== undefined ? getTrendIndicator(change) : null;
  const trendColor = trend ? getTrendColor(change!) : "";
  const trendBgColor = trend ? getTrendBgColor(change!) : "";

  return (
    <View className="flex-1 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[13px] font-outfit-m text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </Text>
        <View className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 items-center justify-center">
          <Ionicons name={icon} size={16} color="#3b82f6" />
        </View>
      </View>

      {loading ? (
        <View className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2" />
      ) : (
        <Text className="text-[24px] font-outfit-sb text-slate-900 dark:text-white mb-2">
          {value}
        </Text>
      )}

      {change !== undefined && !loading && (
        <View className={`flex-row items-center gap-1 px-2 py-1 rounded-lg ${trendBgColor} w-fit`}>
          <Ionicons
            name={trend === "up" ? "arrow-up" : trend === "down" ? "arrow-down" : "remove"}
            size={12}
            color={trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#64748b"}
          />
          <Text className={`text-[11px] font-outfit-sb ${trendColor}`}>
            {Math.abs(change).toFixed(1)}% {changeLabel}
          </Text>
        </View>
      )}
    </View>
  );
}
