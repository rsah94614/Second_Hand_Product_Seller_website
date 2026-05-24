import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatCurrency } from "../../lib/utils/formatting";

interface TopItem {
  id: string;
  title: string;
  subtitle?: string;
  value: number;
  valueLabel?: string;
  rank: number;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface TopItemsWidgetProps {
  title: string;
  items: TopItem[];
  loading?: boolean;
  onViewAll?: () => void;
  valueFormatter?: (value: number) => string;
}

export function TopItemsWidget({
  title,
  items,
  loading = false,
  onViewAll,
  valueFormatter = (v) => formatCurrency(v),
}: TopItemsWidgetProps) {
  if (loading) {
    return (
      <View className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-[14px] font-outfit-sb text-slate-900 dark:text-white">
            {title}
          </Text>
        </View>
        <View className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-[14px] font-outfit-sb text-slate-900 dark:text-white">
          {title}
        </Text>
        {onViewAll && (
          <Pressable onPress={onViewAll} className="flex-row items-center gap-1">
            <Text className="text-[12px] font-outfit-m text-primary-600">View All</Text>
            <Ionicons name="arrow-forward" size={12} color="#3b82f6" />
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View className="py-8 items-center">
          <Text className="text-[13px] font-outfit text-slate-500 dark:text-slate-400">
            No data available
          </Text>
        </View>
      ) : (
        <View>
          {items.map((item) => (
            <View key={item.id} className="flex-row items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
              <View className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center">
                <Text className="text-[11px] font-outfit-sb text-primary-600">
                  {item.rank}
                </Text>
              </View>

              {item.icon && (
                <View className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 items-center justify-center">
                  <Ionicons name={item.icon} size={14} color="#64748b" />
                </View>
              )}

              <View className="flex-1">
                <Text className="text-[13px] font-outfit-m text-slate-900 dark:text-white">
                  {item.title}
                </Text>
                {item.subtitle && (
                  <Text className="text-[11px] font-outfit text-slate-500 dark:text-slate-400">
                    {item.subtitle}
                  </Text>
                )}
              </View>

              <View className="items-end">
                <Text className="text-[13px] font-outfit-sb text-slate-900 dark:text-white">
                  {valueFormatter(item.value)}
                </Text>
                {item.valueLabel && (
                  <Text className="text-[10px] font-outfit text-slate-500 dark:text-slate-400">
                    {item.valueLabel}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
