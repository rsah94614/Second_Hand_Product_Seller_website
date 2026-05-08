import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Text, View, InteractionManager, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Screen } from "../components/ui/Screen";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { getUserProducts, relistProduct } from "../lib/api/products";
import { formatInr } from "../lib/format";
import { getImageUri } from "../lib/product-image";
import type { ProductImage } from "../lib/types";
import { Ionicons } from "@expo/vector-icons";
import { parseApiError, formatErrorForDisplay } from "../lib/utils/errorHandler";

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
      Alert.alert("Relisted", "Your listing has been relisted for another 60 days.");
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
    <Screen>
      <View className="px-5 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-row justify-between items-center z-10">
         <Text className="text-[26px] font-outfit-bl text-slate-900 dark:text-white">My Listings</Text>
         <Button 
           title="New +" 
           onPress={() => router.push("/create-product")} 
           className="py-2.5 px-4 min-h-[40px] rounded-full"
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
        renderItem={({ item: p }) => (
          <Pressable
            onPress={() => {
              openEditProduct(p._id);
            }}
            className="mb-4 flex-row rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm shadow-slate-200/50 dark:shadow-none"
          >
            <View className="relative">
              <Image
                source={{ uri: getImageUri(p.images?.[0]) }}
                style={{ width: 100, height: 100, borderRadius: 16 }}
              />
              {p.isSold && (
                 <View className="absolute top-1 left-1 bg-red-500/90 rounded-md px-1.5 py-0.5">
                    <Text className="text-[9px] font-outfit-b text-white uppercase">Sold</Text>
                 </View>
              )}
            </View>
            <View className="ml-4 flex-1 py-1 flex-col justify-between">
              <View>
                 <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white leading-tight" numberOfLines={2}>
                   {p.title}
                 </Text>
                 <Text className="mt-1 text-[17px] font-outfit-b text-primary-600 dark:text-primary-400">{formatInr(p.price)}</Text>
              </View>
              
              <View className="flex-row items-center justify-between mt-2">
                 <View className={`px-2 py-0.5 rounded-md ${p.isSold ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400' : p.isActive ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <Text className="text-[11px] font-outfit-sb uppercase tracking-wider">{p.isSold ? "Sold Out" : p.isActive ? "Active" : "Inactive"}</Text>
                 </View>
                 
                 <View className="flex-row items-center gap-1.5 opacity-60">
                    <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400 uppercase tracking-widest">Edit</Text>
                    <Ionicons name="create-outline" size={14} color="#64748b" />
                 </View>
              </View>

              {/* Expiry info */}
              {p.daysRemaining !== null && p.daysRemaining !== undefined && !p.isSold && (
                <Text className={`mt-1 text-[11px] font-outfit-m ${p.isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
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
                  className="mt-2 flex-row items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 self-start"
                >
                  <Ionicons name="refresh-outline" size={12} color="#6366f1" />
                  <Text className="text-[11px] font-outfit-sb text-indigo-600 dark:text-indigo-400">Relist</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}
