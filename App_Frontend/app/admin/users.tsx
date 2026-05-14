import { useInfiniteQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { getAdminUsers, updateAdminUser } from "../../lib/api/admin";
import { Ionicons } from "@expo/vector-icons";

export default function AdminUsersScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search to prevent keyboard dismissal and excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  type Page = { users?: Record<string, unknown>[]; nextCursor?: string | null };

  const {
    data,
    status,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPlaceholderData,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ["admin-users", debouncedSearch],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      params.set("limit", "40");
      if (pageParam) params.set("cursor", pageParam);
      return getAdminUsers(params.toString()) as Promise<Page>;
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  });

  const users = useMemo(() => data?.pages.flatMap((p) => p.users || []) || [], [data]);

  const updateM = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: Record<string, unknown> }) =>
      updateAdminUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const isInitialLoading = status === "pending" && !isPlaceholderData;
  const isSearching = isFetching && !isFetchingNextPage;

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950" safeAreaTop={false}>
      <View className="px-4 pt-3 pb-2">
        <View className="relative">
          <View className="absolute left-3.5 top-0 bottom-0 justify-center z-10">
            {isSearching ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <Ionicons name="search" size={16} color="#94a3b8" />
            )}
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search users..."
            placeholderTextColor="#94a3b8"
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white"
          />
        </View>
      </View>

      {status === "error" ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
          <Text className="mt-4 text-[16px] font-outfit-m text-slate-900 dark:text-white">Failed to load users</Text>
          <Text className="mt-1 text-[13px] font-outfit text-slate-500 dark:text-slate-400 text-center">{(error as any)?.message || "Unknown error"}</Text>
          <Pressable onPress={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })} className="mt-6 rounded-xl bg-primary-600 px-6 py-2.5">
            <Text className="text-[14px] font-outfit-sb text-white">Retry</Text>
          </Pressable>
        </View>
      ) : isInitialLoading ? (
        <View className="flex-1 items-center justify-center">
          <Loading message="Loading users..." />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => String(u._id)}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          ListFooterComponent={isFetchingNextPage ? <View className="py-4"><Loading message="Loading more..." /></View> : null}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-[15px] font-outfit text-slate-500">No users found.</Text>
            </View>
          }
          renderItem={({ item: u }: { item: Record<string, unknown> }) => {
            const id = String(u._id);
            const role = String(u.role || "user");
            const active = u.isActive !== false;
            const verified = Boolean(u.isVerified);
            const initials = String(u.name || "U").split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
            return (
              <View className="mb-3 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/60 items-center justify-center">
                    <Text className="text-[14px] font-outfit-b text-primary-700 dark:text-primary-300">{initials}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white leading-tight">{String(u.name)}</Text>
                    <Text className="text-[13px] font-outfit text-slate-500 dark:text-slate-400">{String(u.email)}</Text>
                  </View>
                  <View className="flex-row gap-1.5">
                    <View className={`px-2 py-0.5 rounded-full ${active ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
                      <Text className={`text-[10px] font-outfit-sb uppercase tracking-wider ${active ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{active ? "Active" : "Inactive"}</Text>
                    </View>
                    <View className={`px-2 py-0.5 rounded-full ${role === "admin" ? "bg-amber-100 dark:bg-amber-900/40" : "bg-slate-100 dark:bg-slate-800"}`}>
                      <Text className={`text-[10px] font-outfit-sb uppercase tracking-wider ${role === "admin" ? "text-amber-700 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"}`}>{role}</Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  <Pressable
                    onPress={() => updateM.mutate({ userId: id, payload: { role: role === "admin" ? "user" : "admin" } })}
                    className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 active:bg-slate-200 dark:active:bg-slate-700"
                  >
                    <Text className="text-[12px] font-outfit-b text-slate-700 dark:text-slate-300">Toggle Role</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => updateM.mutate({ userId: id, payload: { isActive: !active } })}
                    className={`rounded-xl px-3 py-2 ${active ? "bg-red-50 dark:bg-red-950/40" : "bg-emerald-50 dark:bg-emerald-950/40"}`}
                  >
                    <Text className={`text-[12px] font-outfit-b ${active ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>{active ? "Deactivate" : "Activate"}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => updateM.mutate({ userId: id, payload: { isVerified: !verified } })}
                    className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2"
                  >
                    <Text className="text-[12px] font-outfit-b text-slate-700 dark:text-slate-300">{verified ? "Unverify" : "Verify"}</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}
