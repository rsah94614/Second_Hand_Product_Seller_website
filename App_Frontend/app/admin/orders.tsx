import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { getAdminOrders, updateAdminOrder } from "../../lib/api/admin";
import { formatInr } from "../../lib/format";

const STATUSES = ["processing", "shipped", "delivered", "cancelled"] as const;

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  processing: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-400" },
  shipped: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-400" },
  delivered: { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-400" },
  cancelled: { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-400" },
};

export default function AdminOrdersScreen() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");

  type Page = { orders?: Record<string, unknown>[]; nextCursor?: string | null };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["admin-orders", status],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("limit", "30");
      if (pageParam) params.set("cursor", pageParam);
      return getAdminOrders(params.toString()) as Promise<Page>;
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const orders = useMemo(() => data?.pages.flatMap((p) => p.orders || []) || [], [data]);

  const patchM = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateAdminOrder(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  if (isLoading && !data) {
    return <Screen><Loading /></Screen>;
  }

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      <View className="flex-row flex-wrap gap-2 px-4 pt-3 pb-2">
        <Pressable
          onPress={() => setStatus("")}
          className={`rounded-full px-4 py-1.5 border ${!status ? "bg-primary-600 border-primary-600" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"}`}
        >
          <Text className={`text-[12px] font-outfit-sb ${!status ? "text-white" : "text-slate-700 dark:text-slate-300"}`}>All</Text>
        </Pressable>
        {STATUSES.map((s) => (
          <Pressable
            key={s}
            onPress={() => setStatus(s === status ? "" : s)}
            className={`rounded-full px-4 py-1.5 border ${status === s ? "bg-primary-600 border-primary-600" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"}`}
          >
            <Text className={`text-[12px] font-outfit-sb capitalize ${status === s ? "text-white" : "text-slate-700 dark:text-slate-300"}`}>{s}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o._id)}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ListFooterComponent={isFetchingNextPage ? <View className="py-4"><Loading message="Loading more..." /></View> : null}
        renderItem={({ item: o }: { item: Record<string, unknown> }) => {
          const id = String(o._id);
          const cur = String(o.status || "");
          const style = STATUS_STYLES[cur] || { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" };
          return (
            <View className="mb-3 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-[12px] font-mono text-slate-400 dark:text-slate-500">#{id.slice(-8).toUpperCase()}</Text>
                <View className={`px-2.5 py-1 rounded-full ${style.bg}`}>
                  <Text className={`text-[11px] font-outfit-sb uppercase tracking-wider ${style.text}`}>{cur}</Text>
                </View>
              </View>
              <Text className="text-[17px] font-outfit-b text-primary-600 dark:text-primary-400 mb-3">{formatInr(Number(o.total || 0))}</Text>
              <View className="flex-row flex-wrap gap-2">
                {STATUSES.filter((s) => s !== cur).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => patchM.mutate({ id, payload: { status: s } })}
                    className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 active:bg-slate-200"
                  >
                    <Text className="text-[12px] font-outfit-b text-slate-700 dark:text-slate-300 capitalize">{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}
