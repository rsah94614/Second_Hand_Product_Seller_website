import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Redirect, router } from "expo-router";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Screen } from "../components/ui/Screen";
import { Loading } from "../components/Loading";
import { EmptyState } from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { getWishlist, toggleWishlist } from "../lib/api/users";
import { formatInr } from "../lib/format";
import { getImageUri } from "../lib/product-image";
import type { ProductImage } from "../lib/types";
import { parseApiError, formatErrorForDisplay } from "../lib/utils/errorHandler";

export default function WishlistScreen() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlist,
    enabled: !!user,
  });

  const removeM = useMutation({
    mutationFn: (productId: string) => toggleWishlist(productId),
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Could not update wishlist.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isLoading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <EmptyState
          title="Could not load wishlist"
          message="Please try again and we will fetch your saved items."
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      </Screen>
    );
  }

  const items = data?.products || data || [];

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(p: { _id: string }) => p._id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        onRefresh={() => refetch()}
        refreshing={false}
        ListEmptyComponent={
          <View className="py-20">
             <EmptyState
               title="Wishlist is empty"
               message="Save products you like so you can find them quickly later."
               actionLabel="Explore products"
               onAction={() => router.push("/")}
             />
          </View>
        }
        renderItem={({ item: p }: { item: { _id: string; title: string; price: number; images?: ProductImage[] } }) => {
          const uri = getImageUri(p.images?.[0]);
          return (
            <Pressable
              onPress={() => router.push(`/product/${p._id}` as never)}
              className="mb-4 flex-row overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm shadow-slate-200/50 dark:shadow-none active:scale-[0.98] transition-transform"
            >
              <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 16 }} transition={200} />
              <View className="ml-4 flex-1 justify-between py-1">
                <View>
                  <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white leading-tight" numberOfLines={2}>
                    {p.title}
                  </Text>
                  <Text className="mt-1.5 text-lg font-outfit-b text-primary-600 dark:text-primary-400">{formatInr(p.price)}</Text>
                </View>
                <Pressable onPress={() => removeM.mutate(p._id)} className="self-start px-2.5 py-1.5 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <Text className="text-[12px] font-outfit-b uppercase tracking-wider text-red-500">Remove</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
