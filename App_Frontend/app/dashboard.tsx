import { useQuery } from "@tanstack/react-query";
import { Link, Redirect, router } from "expo-router";
import { useMemo } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { Screen } from "../components/ui/Screen";
import { Loading } from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import { getUserProducts, patchProduct } from "../lib/api/products";
import { formatInr } from "../lib/format";
import { getImageUri } from "../lib/product-image";
import type { ProductImage } from "../lib/types";
import { Ionicons } from "@expo/vector-icons";

const STAT_CONFIGS = [
  { label: "Total Listings", key: "total", icon: "layers" as const, iconColor: "#4f46e5", bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-600 dark:text-indigo-400" },
  { label: "Active", key: "active", icon: "checkmark-circle" as const, iconColor: "#059669", bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-400" },
  { label: "Sold Items", key: "sold", icon: "pricetag" as const, iconColor: "#e11d48", bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-600 dark:text-rose-400" },
  { label: "Total Views", key: "views", icon: "eye" as const, iconColor: "#d97706", bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400" },
];

export default function SellerDashboardScreen() {
  const { user, loading } = useAuth();

  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ["user-dashboard-products", user?.id],
    queryFn: () => getUserProducts(user!.id),
    enabled: !!user?.id && user.role === "user",
  });

  const metrics = useMemo(() => {
    type P = { isSold?: boolean; isActive?: boolean; views?: number };
    type M = { total: number; active: number; sold: number; inactive: number; views: number };
    const init: M = { total: 0, active: 0, sold: 0, inactive: 0, views: 0 };
    return (products as P[]).reduce<M>(
      (acc, p) => ({
        total: acc.total + 1,
        views: acc.views + (p.views || 0),
        sold: acc.sold + (p.isSold ? 1 : 0),
        active: acc.active + (!p.isSold && p.isActive ? 1 : 0),
        inactive: acc.inactive + (!p.isSold && !p.isActive ? 1 : 0),
      }),
      init
    );
  }, [products]);

  if (loading) return <Screen><Loading /></Screen>;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== "user") {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg font-outfit-sb text-slate-800 dark:text-slate-200">Seller dashboard is for standard accounts.</Text>
        </View>
      </Screen>
    );
  }

  if (isLoading) return <Screen><Loading /></Screen>;

  const recent = [...(products as { _id: string; createdAt?: string }[])].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      <ScrollView className="flex-1 px-5 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <View className="mb-6">
           <Text className="text-[28px] font-outfit-bl text-slate-900 dark:text-white leading-tight">Dashboard</Text>
           <Text className="text-[15px] font-outfit text-slate-500 dark:text-slate-400 mt-1">Manage your campus listings</Text>
        </View>
        
        {/* Stats Grid — 2×2 */}
        <View className="mb-6 flex-row flex-wrap gap-[10px]">
          {STAT_CONFIGS.map((cfg) => (
            <Stat
              key={cfg.key}
              label={cfg.label}
              value={(metrics as Record<string, number>)[cfg.key] ?? 0}
              icon={cfg.icon}
              iconColor={cfg.iconColor}
              bg={cfg.bg}
              textClass={cfg.text}
            />
          ))}
        </View>

        <Link href="/create-product" asChild>
          <Pressable className="mb-4 flex-row items-center justify-center gap-2 rounded-2xl bg-primary-600 py-4 shadow-sm shadow-primary-600/30 active:bg-primary-700">
            <Ionicons name="add" size={22} color="#fff" />
            <Text className="font-outfit-b text-[16px] text-white">Create New Listing</Text>
          </Pressable>
        </Link>
        <Link href="/my-products" asChild>
          <Pressable className="mb-8 flex-row items-center justify-center gap-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-4 active:bg-slate-50 dark:active:bg-slate-800 shadow-sm shadow-slate-100/50 dark:shadow-none">
            <Ionicons name="list" size={18} color="#6366f1" />
            <Text className="font-outfit-sb text-[15px] text-primary-600 dark:text-primary-400">View All Products</Text>
          </Pressable>
        </Link>

        {recent.length > 0 && (
           <Text className="text-[18px] font-outfit-b text-slate-900 dark:text-white mb-4">Recent Listings</Text>
        )}
        
        {recent.length === 0 ? (
           <View className="py-12 items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
              <Text className="text-[15px] font-outfit-m text-slate-500 mb-2">No listings yet</Text>
           </View>
        ) : (
           <View className="mb-12">
             {recent.slice(0, 5).map((p) => (
               <ProductRow key={p._id} product={p as Record<string, unknown>} onSold={() => refetch()} />
             ))}
           </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Stat({
  label, value, icon, iconColor, bg, textClass
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bg: string;
  textClass: string;
}) {
  return (
    <View className="w-[48%] rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
      <View className={`h-10 w-10 rounded-full items-center justify-center mb-3 ${bg}`}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text className={`text-[28px] font-outfit-bl leading-tight ${textClass}`}>{value}</Text>
      <Text className="text-[13px] font-outfit-m text-slate-500 dark:text-slate-400 mt-0.5">{label}</Text>
    </View>
  );
}

function ProductRow({
  product,
  onSold,
}: {
  product: Record<string, unknown>;
  onSold: () => void;
}) {
  const p = product as {
    _id: string;
    title: string;
    price: number;
    isSold?: boolean;
    isActive?: boolean;
    images?: ProductImage[];
  };
  const uri = getImageUri(p.images?.[0]);

  const markSold = () => {
    Alert.alert("Mark sold?", `Mark "${p.title}" as sold?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "destructive",
        onPress: async () => {
          await patchProduct(p._id, { isSold: true, isActive: false });
          onSold();
        },
      },
    ]);
  };

  return (
    <View className="mb-3.5 flex-row rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm shadow-slate-200/50 dark:shadow-none">
      <Pressable onPress={() => router.push(`/edit-product/${p._id}` as never)} className="flex-1 flex-row">
        <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 16 }} />
        <View className="ml-4 flex-1 py-1 flex-col justify-between">
          <View>
            <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white leading-tight" numberOfLines={1}>
              {p.title}
            </Text>
            <Text className="text-[15px] font-outfit-b text-primary-600 dark:text-primary-400 mt-1">{formatInr(p.price)}</Text>
          </View>
        </View>
      </Pressable>
      
      <View className="justify-center px-1">
        {!p.isSold && p.isActive ? (
          <Pressable onPress={markSold} className="bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/40 active:bg-amber-100">
            <Text className="text-[12px] font-outfit-b text-amber-600 dark:text-amber-500 uppercase tracking-widest">Mark Sold</Text>
          </Pressable>
        ) : p.isSold ? (
          <View className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
             <Text className="text-[12px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sold</Text>
          </View>
        ) : (
          <View className="bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/40">
             <Text className="text-[12px] font-outfit-sb text-rose-500 uppercase tracking-widest">Inactive</Text>
          </View>
        )}
      </View>
    </View>
  );
}
