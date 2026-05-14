import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Text, View, InteractionManager, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { getUserProducts, relistProduct } from "../../lib/api/products";
import { formatInr } from "../../lib/format";
import { getImageUri } from "../../lib/product-image";
import type { ProductImage } from "../../lib/types";
import { Ionicons } from "@expo/vector-icons";
import { parseApiError, formatErrorForDisplay } from "../../lib/utils/errorHandler";
import { useToast } from "../../components/ui/AppToast";

const openEditProduct = (productId: string) => {
  setTimeout(() => {
    router.push(`/edit-product/${productId}` as never);
  }, 80);
};

export default function MyProductsScreen() {
  const [ready, setReady] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setReady(true);
    });
    return () => task.cancel();
  }, []);

  useEffect(() => {
    if (ready && !authLoading && !user) {
      router.replace("/(auth)/login");
    }
  }, [ready, authLoading, user]);

  if (!ready || authLoading || !user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#020617" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return <MyProductsContent />;
}

function MyProductsContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["my-products", user?.id],
    queryFn: () => getUserProducts(user!.id),
    enabled: !!user?.id && user?.role === "user",
  });

  const relistM = useMutation({
    mutationFn: (productId: string) => relistProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-products"] });
      showToast("Your listing has been relisted for another 60 days.");
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Could not relist this product.");
      Alert.alert("Failed", formatErrorForDisplay(parsed));
    },
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#020617" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (user?.role !== "user") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#020617" }}>
        <Text style={{ color: "white", fontSize: 18 }}>Seller access only.</Text>
      </View>
    );
  }

  const list = products as {
    _id: string;
    title: string;
    price: number;
    isSold?: boolean;
    isActive?: boolean;
    isExpired?: boolean;
    daysRemaining?: number | null;
    isExpiringSoon?: boolean;
    images?: ProductImage[];
    views?: number;
  }[];

  return (
    <Screen safeAreaTop={false}>
      <View className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-row justify-between items-center z-10">
        <View>
          <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white">Inventory Summary</Text>
          <Text className="text-[13px] font-outfit text-slate-500 dark:text-slate-400">{list.length} item{list.length !== 1 ? 's' : ''}</Text>
        </View>
        <Button
          title="Create New +"
          onPress={() => router.push("/create-product")}
          className="py-2.5 px-5 min-h-[40px] rounded-full"
          textClassName="text-[14px]"
        />
      </View>
      <FlatList
        data={list}
        keyExtractor={(p) => p._id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <View className="py-20">
            <EmptyState
              title="No listings yet"
              message="Create your first listing to start selling on campus."
              actionLabel="Create Listing"
              onAction={() => router.push("/create-product")}
            />
          </View>
        }
        renderItem={({ item: p }) => {
          const badgeBg = p.isSold ? 'bg-red-50 dark:bg-red-900/30' : p.isActive ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-800';
          const badgeText = p.isSold ? 'text-red-600 dark:text-red-400' : p.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400';

          return (
            <Pressable
              onPress={() => {
                openEditProduct(p._id);
              }}
              className="mb-4 flex-row rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm shadow-slate-200/50 dark:shadow-none"
            >
              <View className="relative bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden">
                <Image
                  source={{ uri: getImageUri(p.images?.[0]) }}
                  style={{ width: 100, height: 100 }}
                  contentFit="cover"
                  transition={200}
                />
                {p.isSold && (
                  <View className="absolute top-2 left-2 bg-red-500 rounded-md px-2 py-1 shadow-sm">
                    <Text className="text-[10px] font-outfit-b text-white uppercase tracking-wider">Sold</Text>
                  </View>
                )}
              </View>
              <View className="ml-4 flex-1 py-1 flex-col justify-between">
                <View>
                  <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white leading-tight" numberOfLines={2}>
                    {p.title}
                  </Text>
                  <Text className="mt-1.5 text-[18px] font-outfit-b text-primary-600 dark:text-primary-400">{formatInr(p.price)}</Text>
                </View>

                <View className="flex-row items-center justify-between mt-3">
                  <View className={`px-2.5 py-1 rounded-md ${badgeBg}`}>
                    <Text className={`text-[10px] font-outfit-b uppercase tracking-wider ${badgeText}`}>
                      {p.isSold ? "Sold Out" : p.isActive ? "Active" : "Inactive"}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                    <Text className="text-[11px] font-outfit-sb text-slate-600 dark:text-slate-300 uppercase tracking-widest">Edit</Text>
                    <Ionicons name="create-outline" size={12} color="#64748b" />
                  </View>
                </View>

                {/* Expiry info */}
                {p.daysRemaining !== null && p.daysRemaining !== undefined && !p.isSold && (
                  <Text className={`mt-2 text-[11px] font-outfit-m ${p.isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {p.daysRemaining > 0 ? `Expires in ${p.daysRemaining}d` : "Expired"}
                  </Text>
                )}

                {/* Relist button */}
                {(p.isExpired || (!p.isActive && !p.isSold)) && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      Alert.alert("Relist", "Relist this item for another 60 days?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Relist", onPress: () => relistM.mutate(p._id) },
                      ]);
                    }}
                    className="mt-2 flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 self-start"
                  >
                    <Ionicons name="refresh-outline" size={14} color="#6366f1" />
                    <Text className="text-[12px] font-outfit-sb text-primary-700 dark:text-primary-400">Relist Now</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          )
        }}
      />
    </Screen>
  );
}
