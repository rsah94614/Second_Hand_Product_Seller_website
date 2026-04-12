import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { deleteAdminProduct, getAdminProducts, updateAdminProduct } from "../../lib/api/admin";
import { formatInr } from "../../lib/format";
import { Ionicons } from "@expo/vector-icons";

export default function AdminProductsScreen() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  type Page = { products?: Record<string, unknown>[]; nextCursor?: string | null };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["admin-products", search],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "30");
      if (pageParam) params.set("cursor", pageParam);
      return getAdminProducts(params.toString()) as Promise<Page>;
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const products = useMemo(() => data?.pages.flatMap((p) => p.products || []) || [], [data]);

  const patchM = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => updateAdminProduct(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const delM = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  if (isLoading && !data) {
    return <Screen><Loading /></Screen>;
  }

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      <View className="px-4 pt-3 pb-2">
        <View className="relative">
          <View className="absolute left-3.5 top-0 bottom-0 justify-center z-10">
            <Ionicons name="search" size={16} color="#94a3b8" />
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
      <FlatList
        data={products}
        keyExtractor={(p) => String(p._id)}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ListFooterComponent={isFetchingNextPage ? <View className="py-4"><Loading message="Loading more..." /></View> : null}
        renderItem={({ item: p }: { item: Record<string, unknown> }) => {
          const id = String(p._id);
          const active = p.isActive !== false;
          const sold = Boolean(p.isSold);
          return (
            <View className="mb-3 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 pr-3">
                  <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white leading-tight" numberOfLines={1}>{String(p.title)}</Text>
                  <Text className="text-[15px] font-outfit-b text-primary-600 dark:text-primary-400 mt-0.5">{formatInr(Number(p.price || 0))}</Text>
                </View>
                <View className="flex-row gap-1.5">
                  {sold && (
                    <View className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40">
                      <Text className="text-[10px] font-outfit-sb uppercase tracking-wider text-red-600 dark:text-red-400">Sold</Text>
                    </View>
                  )}
                  <View className={`px-2 py-0.5 rounded-full ${active ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-slate-100 dark:bg-slate-800"}`}>
                    <Text className={`text-[10px] font-outfit-sb uppercase tracking-wider ${active ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>{active ? "Active" : "Inactive"}</Text>
                  </View>
                </View>
              </View>
              <View className="flex-row flex-wrap gap-2 mt-1">
                <Pressable
                  onPress={() => patchM.mutate({ id, payload: { isActive: !active } })}
                  className={`rounded-xl px-3 py-2 ${active ? "bg-slate-100 dark:bg-slate-800" : "bg-emerald-50 dark:bg-emerald-950/40"}`}
                >
                  <Text className={`text-[12px] font-outfit-b ${active ? "text-slate-700 dark:text-slate-300" : "text-emerald-700 dark:text-emerald-400"}`}>{active ? "Deactivate" : "Activate"}</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/product/${id}` as never)}
                  className="rounded-xl bg-primary-50 dark:bg-primary-950/40 px-3 py-2"
                >
                  <Text className="text-[12px] font-outfit-b text-primary-600 dark:text-primary-400">View</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    Alert.alert("Delete product?", "This action cannot be undone.", [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => delM.mutate(id) },
                    ])
                  }
                  className="rounded-xl bg-red-50 dark:bg-red-950/40 px-3 py-2"
                >
                  <Text className="text-[12px] font-outfit-b text-red-600 dark:text-red-400">Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}
