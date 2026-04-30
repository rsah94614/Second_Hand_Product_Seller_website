import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { EmptyState } from "../../components/EmptyState";
import { getModerationQueue, resolveModerationItem, assignModerationItem } from "../../lib/api/admin";
import { Ionicons } from "@expo/vector-icons";

type QueueItem = {
  _id: string;
  itemType: string;
  itemId: string;
  reason: string;
  priority: string;
  status: string;
  resolution?: string;
  assignedTo?: { name?: string; email?: string } | null;
  createdAt: string;
};

const priorityColor = (p: string) => {
  if (p === "high") return { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-600 dark:text-red-400" };
  if (p === "medium") return { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400" };
  return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" };
};

const statusColor = (s: string) => {
  if (s === "pending") return { bg: "bg-yellow-50 dark:bg-yellow-950/30", text: "text-yellow-700 dark:text-yellow-400" };
  if (s === "in_progress") return { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400" };
  return { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400" };
};

export default function AdminModerationQueueScreen() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [resolutionText, setResolutionText] = useState<Record<string, string>>({});

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-moderation-queue", statusFilter],
    queryFn: () => getModerationQueue(statusFilter ? `status=${statusFilter}` : ""),
    refetchInterval: 30000,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ itemId, resolution }: { itemId: string; resolution: string }) =>
      resolveModerationItem(itemId, { resolution }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-moderation-queue"] }),
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert("Error", msg || "Failed to resolve.");
    },
  });

  const assignMutation = useMutation({
    mutationFn: (itemId: string) => assignModerationItem(itemId, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-moderation-queue"] }),
  });

  const items: QueueItem[] = data?.items || [];
  const stats = data?.stats || {};

  const FILTERS = [
    { label: "All", value: "" },
    { label: "Pending", value: "pending" },
    { label: "In Progress", value: "in_progress" },
    { label: "Resolved", value: "resolved" },
  ];

  if (isLoading && !data) {
    return <Screen><Loading /></Screen>;
  }

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      {/* Stats */}
      <View className="flex-row gap-2 px-4 pt-4 pb-2">
        {[
          { label: "Pending", value: stats.pending ?? 0, color: "text-yellow-600" },
          { label: "In Progress", value: stats.in_progress ?? 0, color: "text-blue-600" },
          { label: "Resolved", value: stats.resolved ?? 0, color: "text-emerald-600" },
        ].map((s) => (
          <View key={s.label} className="flex-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 items-center">
            <Text className={`text-[22px] font-outfit-bl ${s.color}`}>{s.value}</Text>
            <Text className="text-[11px] font-outfit-m text-slate-500 dark:text-slate-400">{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Filter tabs */}
      <View className="flex-row gap-2 px-4 pb-3 overflow-x-auto">
        {FILTERS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-full border ${statusFilter === f.value ? "bg-primary-600 border-primary-600" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"}`}
          >
            <Text className={`text-[13px] font-outfit-sb ${statusFilter === f.value ? "text-white" : "text-slate-700 dark:text-slate-300"}`}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        refreshing={isRefetching}
        onRefresh={refetch}
        contentContainerStyle={{ padding: 16, paddingTop: 4, flexGrow: 1 }}
        ListEmptyComponent={
          <View className="py-20">
            <EmptyState title="Queue is empty" message="No items match the current filter." />
          </View>
        }
        renderItem={({ item }) => {
          const pc = priorityColor(item.priority);
          const sc = statusColor(item.status);
          return (
            <View className="mb-3 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[15px] font-outfit-sb text-slate-900 dark:text-white capitalize">
                  {item.itemType} · {String(item.itemId).slice(-8).toUpperCase()}
                </Text>
                <View className="flex-row gap-1.5">
                  <View className={`px-2 py-0.5 rounded-full ${pc.bg}`}>
                    <Text className={`text-[10px] font-outfit-b uppercase ${pc.text}`}>{item.priority}</Text>
                  </View>
                  <View className={`px-2 py-0.5 rounded-full ${sc.bg}`}>
                    <Text className={`text-[10px] font-outfit-b uppercase ${sc.text}`}>{item.status.replace("_", " ")}</Text>
                  </View>
                </View>
              </View>

              <View className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 mb-3">
                <Text className="text-[13px] font-outfit text-slate-700 dark:text-slate-300">{item.reason}</Text>
              </View>

              <Text className="text-[11px] font-outfit text-slate-400 dark:text-slate-500 mb-3">
                {new Date(item.createdAt).toLocaleDateString()}
                {item.assignedTo ? ` · Assigned to ${item.assignedTo.name || item.assignedTo.email}` : ""}
              </Text>

              {item.status !== "resolved" && (
                <View className="gap-2">
                  {!item.assignedTo && (
                    <Pressable
                      onPress={() => assignMutation.mutate(item._id)}
                      disabled={assignMutation.isPending}
                      className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 px-3 py-2.5 items-center"
                    >
                      <Text className="text-[13px] font-outfit-sb text-indigo-700 dark:text-indigo-400">Assign to Me</Text>
                    </Pressable>
                  )}
                  <View className="flex-row gap-2">
                    <TextInput
                      value={resolutionText[item._id] || ""}
                      onChangeText={(t) => setResolutionText((p) => ({ ...p, [item._id]: t }))}
                      placeholder="Resolution notes..."
                      placeholderTextColor="#94a3b8"
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-[14px] font-outfit text-slate-900 dark:text-white"
                    />
                    <Pressable
                      onPress={() => {
                        const resolution = resolutionText[item._id]?.trim();
                        if (!resolution) { Alert.alert("Required", "Enter a resolution note."); return; }
                        resolveMutation.mutate({ itemId: item._id, resolution });
                      }}
                      disabled={resolveMutation.isPending}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 items-center justify-center"
                    >
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              )}

              {item.status === "resolved" && item.resolution && (
                <View className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3">
                  <Text className="text-[11px] font-outfit-sb text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Resolution</Text>
                  <Text className="text-[13px] font-outfit text-emerald-800 dark:text-emerald-300">{item.resolution}</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </Screen>
  );
}
