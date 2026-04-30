import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { EmptyState } from "../../components/EmptyState";
import { getAdminActivityTimeline } from "../../lib/api/admin";
import { Ionicons } from "@expo/vector-icons";

type Activity = {
  _id: string;
  action: string;
  targetType: string;
  admin?: { name?: string; email?: string };
  details?: Record<string, unknown>;
  createdAt: string;
};

const actionIcon = (action: string): keyof typeof Ionicons.glyphMap => {
  if (action.includes("SUSPEND")) return "ban-outline";
  if (action.includes("DELETE")) return "trash-outline";
  if (action.includes("APPROVE")) return "checkmark-circle-outline";
  if (action.includes("REJECT")) return "close-circle-outline";
  if (action.includes("BULK")) return "layers-outline";
  if (action.includes("USER")) return "person-outline";
  if (action.includes("PRODUCT")) return "cube-outline";
  if (action.includes("RULE")) return "shield-outline";
  return "ellipse-outline";
};

const actionColor = (action: string) => {
  if (action.includes("DELETE") || action.includes("SUSPEND") || action.includes("REJECT")) return "#dc2626";
  if (action.includes("APPROVE") || action.includes("ENABLE")) return "#059669";
  if (action.includes("BULK")) return "#d97706";
  return "#6366f1";
};

export default function AdminActivityScreen() {
  type Page = { activities?: Activity[]; nextCursor?: string | null };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
    useInfiniteQuery({
      queryKey: ["admin-activity"],
      initialPageParam: null as string | null,
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams();
        params.set("limit", "30");
        if (pageParam) params.set("cursor", pageParam);
        return getAdminActivityTimeline(params.toString()) as Promise<Page>;
      },
      getNextPageParam: (last) => last.nextCursor ?? undefined,
    });

  const activities = useMemo(
    () => data?.pages.flatMap((p) => p.activities || []) || [],
    [data]
  );

  if (isLoading && !data) {
    return <Screen><Loading /></Screen>;
  }

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      <FlatList
        data={activities}
        keyExtractor={(a) => a._id}
        refreshing={isRefetching}
        onRefresh={refetch}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.4}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListHeaderComponent={
          <View className="mb-4">
            <Text className="text-[13px] font-outfit-m text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Admin Tools</Text>
            <Text className="text-[24px] font-outfit-bl text-slate-900 dark:text-white">Activity Timeline</Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? <View className="py-4"><Loading message="Loading more..." /></View> : null
        }
        ListEmptyComponent={
          <View className="py-20">
            <EmptyState title="No activity yet" message="Admin actions will appear here." />
          </View>
        }
        renderItem={({ item: a }) => {
          const color = actionColor(a.action);
          const icon = actionIcon(a.action);
          const label = a.action.replace(/_/g, " ");
          return (
            <View className="mb-3 flex-row gap-3">
              {/* Timeline line + dot */}
              <View className="items-center">
                <View
                  className="h-9 w-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <Ionicons name={icon} size={18} color={color} />
                </View>
                <View className="flex-1 w-0.5 bg-slate-100 dark:bg-slate-800 mt-1" />
              </View>

              {/* Content */}
              <View className="flex-1 pb-3">
                <View className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
                  <Text className="text-[14px] font-outfit-sb text-slate-900 dark:text-white capitalize mb-1">
                    {label.toLowerCase()}
                  </Text>
                  {a.admin && (
                    <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400">
                      by {a.admin.name || a.admin.email}
                    </Text>
                  )}
                  {a.details && Object.keys(a.details).length > 0 && (
                    <View className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                      {Object.entries(a.details)
                        .filter(([, v]) => v !== null && v !== undefined && v !== "")
                        .slice(0, 3)
                        .map(([k, v]) => (
                          <Text key={k} className="text-[11px] font-outfit text-slate-500 dark:text-slate-400">
                            {k}: {String(v)}
                          </Text>
                        ))}
                    </View>
                  )}
                  <Text className="text-[11px] font-outfit-m text-slate-400 dark:text-slate-500 mt-2">
                    {new Date(a.createdAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}
