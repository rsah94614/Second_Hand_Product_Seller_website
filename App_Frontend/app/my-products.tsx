import { useQuery } from "@tanstack/react-query";
import { Redirect, router } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Screen } from "../components/ui/Screen";
import { Loading } from "../components/Loading";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { getUserProducts } from "../lib/api/products";
import { formatInr } from "../lib/format";
import { getImageUri } from "../lib/product-image";
import type { ProductImage } from "../lib/types";
import { Ionicons } from "@expo/vector-icons";

export default function MyProductsScreen() {
  const { user, loading } = useAuth();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["my-products", user?.id],
    queryFn: () => getUserProducts(user!.id),
    enabled: !!user?.id && user.role === "user",
  });

  if (loading || isLoading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== "user") {
    return <Screen><View className="flex-1 items-center justify-center"><Text className="font-outfit-sb text-lg text-slate-800 dark:text-slate-200">Seller access only.</Text></View></Screen>;
  }

  const list = products as {
    _id: string;
    title: string;
    price: number;
    isSold?: boolean;
    isActive?: boolean;
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
            onPress={() => router.push(`/edit-product/${p._id}` as never)}
            className="mb-4 flex-row rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm shadow-slate-200/50 dark:shadow-none active:scale-[0.98] transition-transform"
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
                 <View className={`px-2 py-0.5 rounded-md ${p.isSold ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400' : p.isActive ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Text className="text-[11px] font-outfit-sb uppercase tracking-wider">{p.isSold ? "Sold Out" : p.isActive ? "Active" : "Inactive"}</Text>
                 </View>
                 
                 <View className="flex-row items-center gap-1.5 opacity-60">
                    <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400 uppercase tracking-widest">Edit</Text>
                    <Ionicons name="create-outline" size={14} color="#64748b" />
                 </View>
              </View>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}
