import { useInfiniteQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { deleteAdminProduct, getAdminProducts, updateAdminProduct } from "../../lib/api/admin";
import { formatInr } from "../../lib/format";
import { Ionicons } from "@expo/vector-icons";

export default function AdminProductsScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  type Page = { products?: Record<string, unknown>[]; nextCursor?: string | null };

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
    queryKey: ["admin-products", debouncedSearch],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      params.set("limit", "30");
      if (pageParam) params.set("cursor", pageParam);
      return getAdminProducts(params.toString()) as Promise<Page>;
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  });

  const products = useMemo(() => data?.pages.flatMap((p) => p.products || []) || [], [data]);

  const patchM = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateAdminProduct(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const delM = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
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
            placeholder="Search products..."
            placeholderTextColor="#94a3b8"
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white"
          />
        </View>
      </View>

      {status === "error" ? (
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
          <Text className="mt-4 text-[16px] font-outfit-m text-slate-900 dark:text-white">Failed to load products</Text>
          <Text className="mt-1 text-[13px] font-outfit text-slate-500 dark:text-slate-400 text-center">{(error as any)?.message || "Unknown error"}</Text>
          <Pressable onPress={() => queryClient.invalidateQueries({ queryKey: ["admin-products"] })} className="mt-6 rounded-xl bg-primary-600 px-6 py-2.5">
            <Text className="text-[14px] font-outfit-sb text-white">Retry</Text>
          </Pressable>
        </View>
      ) : isInitialLoading ? (
        <View className="flex-1 items-center justify-center">
          <Loading message="Loading products..." />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => String(p._id)}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          ListFooterComponent={isFetchingNextPage ? <View className="py-4"><Loading message="Loading more..." /></View> : null}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-[15px] font-outfit text-slate-500">No products found.</Text>
            </View>
          }
          renderItem={({ item: p }: { item: Record<string, unknown> }) => {
            const id = String(p._id);
            const active = p.isActive !== false;
            return (
              <View className="mb-3 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-[12px] font-mono text-slate-400 dark:text-slate-500">#{id.slice(-8).toUpperCase()}</Text>
                  <View className={`px-2 py-0.5 rounded-full ${active ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
                    <Text className={`text-[10px] font-outfit-sb uppercase tracking-wider ${active ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{active ? "Active" : "Inactive"}</Text>
                  </View>
                </View>
                <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white leading-tight mb-1">{String(p.title)}</Text>
                <Text className="text-[17px] font-outfit-b text-primary-600 dark:text-primary-400 mb-4">{formatInr(Number(p.price || 0))}</Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => patchM.mutate({ id, payload: { isActive: !active } })}
                    className={`rounded-xl px-4 py-2 ${active ? "bg-red-50 dark:bg-red-950/40" : "bg-emerald-50 dark:bg-emerald-950/40"}`}
                  >
                    <Text className={`text-[13px] font-outfit-sb ${active ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>{active ? "Deactivate" : "Activate"}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      Alert.alert("Delete Product?", "This cannot be undone.", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: () => delM.mutate(id) },
                      ])
                    }
                    className="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2"
                  >
                    <Text className="text-[13px] font-outfit-sb text-slate-700 dark:text-slate-300">Delete</Text>
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
