import { View, Text, FlatList } from "react-native";
import { formatCurrency, formatPercentage, formatNumberWithSeparators } from "../../lib/utils/formatting";

interface CategoryItem {
  id: string;
  name: string;
  revenue: number;
  salesVolume: number;
  percentOfTotal: number;
  activeSellers: number;
  avgOrderValue: number;
}

interface CategoryBreakdownWidgetProps {
  title?: string;
  categories: CategoryItem[];
  loading?: boolean;
}

export function CategoryBreakdownWidget({
  title = "Category Breakdown",
  categories,
  loading = false,
}: CategoryBreakdownWidgetProps) {
  if (loading) {
    return (
      <View className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
        <Text className="text-[14px] font-outfit-sb text-slate-900 dark:text-white mb-4">
          {title}
        </Text>
        <View className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
      <Text className="text-[14px] font-outfit-sb text-slate-900 dark:text-white mb-4">
        {title}
      </Text>

      {categories.length === 0 ? (
        <View className="py-8 items-center">
          <Text className="text-[13px] font-outfit text-slate-500 dark:text-slate-400">
            No data available
          </Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View className="py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[13px] font-outfit-m text-slate-900 dark:text-white flex-1">
                  {item.name}
                </Text>
                <Text className="text-[13px] font-outfit-sb text-slate-900 dark:text-white">
                  {formatCurrency(item.revenue)}
                </Text>
              </View>

              {/* Progress bar */}
              <View className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-2 overflow-hidden">
                <View
                  className="h-full bg-primary-600 rounded-full"
                  style={{ width: `${Math.min(item.percentOfTotal, 100)}%` }}
                />
              </View>

              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text className="text-[10px] font-outfit text-slate-500 dark:text-slate-400">
                    {formatNumberWithSeparators(item.salesVolume, 0)} orders
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-[10px] font-outfit text-slate-500 dark:text-slate-400">
                    {formatPercentage(item.percentOfTotal, 1)} of total
                  </Text>
                </View>
                <View className="flex-1 items-end">
                  <Text className="text-[10px] font-outfit text-slate-500 dark:text-slate-400">
                    {item.activeSellers} sellers
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
