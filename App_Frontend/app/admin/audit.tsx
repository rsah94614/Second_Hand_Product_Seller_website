import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { getAdminAuditLogs } from "../../lib/api/admin";
import { Ionicons } from "@expo/vector-icons";

export default function AdminAuditScreen() {
  const [targetType, setTargetType] = useState("");

  type Page = { logs?: Record<string, unknown>[]; nextCursor?: string | null };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["admin-audit", targetType],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string> = { limit: "40" };
      if (targetType.trim()) params.targetType = targetType.trim();
      if (pageParam) params.cursor = pageParam;
      return getAdminAuditLogs(params) as Promise<Page>;
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const rows = useMemo(() => data?.pages.flatMap((p) => p.logs || []) || [], [data]);

  if (isLoading && !data) {
    return <Screen><Loading /></Screen>;
  }

  const formatDate = (dateStr: unknown) => {
    if (!dateStr) return "";
    try {
      return new Date(String(dateStr)).toLocaleString();
    } catch {
      return String(dateStr);
    }
  };

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950" safeAreaTop={false}>
      <View className="px-4 pt-3 pb-2">
        <View className="relative">
          <View className="absolute left-3.5 top-0 bottom-0 justify-center z-10">
            <Ionicons name="filter" size={15} color="#94a3b8" />
          </View>
          <TextInput
            value={targetType}
            onChangeText={setTargetType}
            placeholder="Filter by target type (e.g. product, user)..."
            placeholderTextColor="#94a3b8"
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-3 text-[14px] font-outfit text-slate-900 dark:text-white"
          />
        </View>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(log) => String(log._id)}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ListFooterComponent={isFetchingNextPage ? <View className="py-4"><Loading message="Loading..." /></View> : null}
        ListEmptyComponent={
          <View className="py-16 items-center">
            <Text className="text-[15px] font-outfit-m text-slate-500 dark:text-slate-400">No audit logs found.</Text>
          </View>
        }
        renderItem={({ item: log }: { item: Record<string, unknown> }) => (
          <View className="mb-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="time-outline" size={12} color="#94a3b8" />
                <Text className="text-[11px] font-outfit text-slate-400 dark:text-slate-500">{formatDate(log.createdAt)}</Text>
              </View>
              {log.targetType ? (
                <View className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-outfit-sb uppercase tracking-wider text-slate-500 dark:text-slate-400">{String(log.targetType)}</Text>
                </View>
              ) : null}
            </View>
            <Text className="text-[15px] font-outfit-sb text-slate-900 dark:text-white">{String(log.action || "")}</Text>
            {log.details ? <Text className="text-[13px] font-outfit text-slate-600 dark:text-slate-400 mt-1">{String(log.details)}</Text> : null}
          </View>
        )}
      />
    </Screen>
  );
}
