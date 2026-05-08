import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { getAdminReports, updateAdminReport } from "../../lib/api/admin";
import { Ionicons } from "@expo/vector-icons";

const STATUSES = ["open", "reviewed", "resolved", "dismissed"] as const;
const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  open:      { bg: "bg-red-100 dark:bg-red-900/40",    text: "text-red-700 dark:text-red-400" },
  reviewed:  { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-400" },
  resolved:  { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-400" },
  dismissed: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-500 dark:text-slate-400" },
};

export default function AdminReportsScreen() {
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  type Page = { reports?: Record<string, unknown>[]; nextCursor?: string | null };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["admin-reports"],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("limit", "40");
      if (pageParam) params.set("cursor", pageParam);
      return getAdminReports(params.toString()) as Promise<Page>;
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const reports = useMemo(() => data?.pages.flatMap((p) => p.reports || []) || [], [data]);

  const patchM = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateAdminReport(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reports"] }),
  });

  if (isLoading && !data) {
    return <Screen><Loading /></Screen>;
  }

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950" safeAreaTop={false}>
      <FlatList
        data={reports}
        keyExtractor={(r) => String(r._id)}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<View className="py-20 items-center"><Text className="text-[15px] font-outfit-m text-slate-500 dark:text-slate-400 mt-4">No reports yet.</Text></View>}
        ListFooterComponent={isFetchingNextPage ? <View className="py-4"><Loading message="Loading..." /></View> : null}
        renderItem={({ item: r }: { item: Record<string, unknown> }) => {
          const id = String(r._id);
          const cur = String(r.status || "open");
          const style = STATUS_STYLE[cur] || STATUS_STYLE.open;
          return (
            <View className="mb-4 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="flag" size={14} color="#e11d48" />
                  <Text className="text-[12px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest">{String(r.targetType || "")}</Text>
                </View>
                <View className={`px-2.5 py-1 rounded-full ${style.bg}`}>
                  <Text className={`text-[11px] font-outfit-sb uppercase tracking-wider ${style.text}`}>{cur}</Text>
                </View>
              </View>
              <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white mb-1">{String(r.reason || "")}</Text>
              {r.details ? <Text className="text-[13px] font-outfit text-slate-600 dark:text-slate-400 mb-3">{String(r.details)}</Text> : null}
              <TextInput
                value={notes[id] ?? ""}
                onChangeText={(t) => setNotes((n) => ({ ...n, [id]: t }))}
                placeholder="Add admin notes..."
                placeholderTextColor="#94a3b8"
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-[14px] font-outfit text-slate-900 dark:text-white mb-3"
                multiline
              />
              <View className="flex-row flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => patchM.mutate({ id, payload: { status: s, adminNotes: notes[id] || "" } })}
                    className={`rounded-xl px-3 py-1.5 ${s === cur ? "bg-primary-600" : "bg-slate-100 dark:bg-slate-800"}`}
                  >
                    <Text className={`text-[12px] font-outfit-b capitalize ${s === cur ? "text-white" : "text-slate-700 dark:text-slate-300"}`}>{s}</Text>
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
