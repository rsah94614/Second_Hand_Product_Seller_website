import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  View,
  Pressable,
  ScrollView,
} from "react-native";
import { Screen } from "../../components/ui/Screen";
import { ProductCard, type ProductListItem } from "../../components/ProductCard";
import { Loading } from "../../components/Loading";
import { getProducts, getProductCategories } from "../../lib/api/products";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

const PAGE_SIZE = 12;

function buildQuery(filters: Record<string, string>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  params.set("limit", String(PAGE_SIZE));
  return params.toString();
}

// Category emoji map
const CATEGORY_EMOJI: Record<string, string> = {
  "Electronics": "💻",
  "Books & Study Materials": "📚",
  "Fashion & Clothing": "👕",
  "Hostel Essentials": "🏠",
  "Furniture & Decor": "🛋️",
  "Sports & Fitness": "🏋️",
  "Bags & Accessories": "🎒",
  "Cycles": "🚲",
  "Academic Tools": "📐",
  "Other": "📦",
};
const CATEGORY_COLORS = [
  { bg: "bg-indigo-100 dark:bg-indigo-900/50", text: "text-indigo-700 dark:text-indigo-300" },
  { bg: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/50", text: "text-emerald-700 dark:text-emerald-300" },
  { bg: "bg-rose-100 dark:bg-rose-900/50", text: "text-rose-700 dark:text-rose-300" },
  { bg: "bg-cyan-100 dark:bg-cyan-900/50", text: "text-cyan-700 dark:text-cyan-300" },
  { bg: "bg-violet-100 dark:bg-violet-900/50", text: "text-violet-700 dark:text-violet-300" },
  { bg: "bg-orange-100 dark:bg-orange-900/50", text: "text-orange-700 dark:text-orange-300" },
  { bg: "bg-teal-100 dark:bg-teal-900/50", text: "text-teal-700 dark:text-teal-300" },
];

export default function HomeScreen() {
  const [search, setSearch] = useState("");
  const { user } = useAuth();

  const filters = { search: search.trim(), sortBy: "createdAt", sortOrder: "desc" };

  type Page = { products?: ProductListItem[]; nextCursor?: string | null };

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, refetch, isRefetching } =
    useInfiniteQuery({
      queryKey: ["products-home", filters],
      initialPageParam: null as string | null,
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams(buildQuery(filters));
        if (pageParam) params.set("cursor", pageParam);
        return getProducts(params.toString()) as Promise<Page>;
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

  const { data: catRes } = useQuery({
    queryKey: ["product-categories"],
    queryFn: getProductCategories,
    staleTime: 5 * 60 * 1000,
  });

  const categories: string[] = catRes?.categories?.map((c: { name: string }) => c.name).slice(0, 10) ||
    ["Electronics", "Books & Study Materials", "Cycles", "Fashion & Clothing", "Hostel Essentials", "Sports & Fitness"];

  const products: ProductListItem[] = data?.pages.flatMap((p) => p.products || []) || [];

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const userInitials = user?.name?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  const ListHeader = (
    <View>
      {/* ── Hero Banner ── */}
      <View className="mx-4 mt-4 mb-4 rounded-3xl overflow-hidden bg-slate-900" style={{ minHeight: 160 }}>
        {/* Gradient overlay */}
        <View className="absolute inset-0 bg-indigo-950 opacity-95" />
        {/* Glow orbs */}
        <View className="absolute top-[-40%] left-[-10%] w-[60%] h-[200%] rounded-full opacity-40"
          style={{ backgroundColor: "rgba(99,102,241,0.35)", transform: [{ scaleX: 1.5 }] }} />
        <View className="absolute bottom-[-30%] right-[-10%] w-[50%] h-[160%] rounded-full opacity-30"
          style={{ backgroundColor: "rgba(34,211,238,0.35)", transform: [{ scaleX: 1.5 }] }} />

        <View className="relative z-10 p-6">
          {/* Live badge */}
          <View className="flex-row items-center gap-2 mb-4 self-start bg-white/10 border border-white/15 px-3 py-1.5 rounded-full">
            <View className="h-2 w-2 rounded-full bg-cyan-400" />
            <Text className="text-[12px] font-outfit-sb text-white/80">Campus Mitra Marketplace</Text>
          </View>

          <Text className="text-[24px] font-outfit-bl text-white leading-tight mb-2">
            Buy campus essentials{"\n"}before they&apos;re gone.
          </Text>
          <Text className="text-[13px] font-outfit text-white/60 mb-5">
            Student-to-student deals, fresh listings every day.
          </Text>

          <View className="flex-row gap-2">
            <Link href="/products" asChild>
              <Pressable className="flex-row items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-4 py-2 active:bg-white/20">
                <Text className="text-[13px] font-outfit-sb text-white">Browse All</Text>
                <Ionicons name="arrow-forward" size={13} color="#fff" />
              </Pressable>
            </Link>
            <Link href={user ? "/create-product" : "/(auth)/register"} asChild>
              <Pressable className="flex-row items-center gap-1.5 bg-primary-500/80 border border-primary-400/30 rounded-full px-4 py-2 active:bg-primary-600">
                <Text className="text-[13px] font-outfit-sb text-white">{user ? "List an Item" : "Start Selling"}</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>

      {/* ── Category Strip ── */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between px-5 mb-3">
          <Text className="text-[17px] font-outfit-b text-slate-900 dark:text-white">Browse by Category</Text>
          <Link href="/products" asChild>
            <Pressable>
              <Text className="text-[13px] font-outfit-sb text-primary-600 dark:text-primary-400">See All</Text>
            </Pressable>
          </Link>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {categories.map((cat, i) => {
            const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
            const emoji = CATEGORY_EMOJI[cat] || "📦";
            return (
              <Pressable
                key={cat}
                onPress={() => router.push(`/products?category=${encodeURIComponent(cat)}` as never)}
                className={`items-center rounded-2xl px-4 py-3 min-w-[80px] active:opacity-80 ${color.bg}`}
              >
                <Text className="text-2xl mb-1">{emoji}</Text>
                <Text className={`text-[11px] font-outfit-sb text-center leading-tight ${color.text}`} numberOfLines={2}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Latest Products Header ── */}
      <View className="flex-row items-center justify-between px-5 mb-2">
        <Text className="text-[17px] font-outfit-b text-slate-900 dark:text-white">Latest Listings</Text>
        <Link href="/products" asChild>
          <Pressable>
            <Text className="text-[13px] font-outfit-sb text-primary-600 dark:text-primary-400">View All</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      {/* ── Top Header ── */}
      <View className="bg-primary-600 dark:bg-primary-900 px-5 pb-3 pt-4 z-10">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-[12px] font-outfit-m text-primary-200 uppercase tracking-widest">
              {user ? `Hey, ${user.name?.split(" ")[0]} 👋` : "Welcome to"}
            </Text>
            <Text className="text-[24px] font-outfit-bl text-white leading-tight">
              Campus Mitra
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push("/notifications" as never)}
              className="h-10 w-10 rounded-full bg-white/20 items-center justify-center border border-white/10 active:bg-white/30"
            >
              <Ionicons name="notifications-outline" size={19} color="#ffffff" />
            </Pressable>
            {user ? (
              <Pressable
                onPress={() => router.push("/(tabs)/profile" as never)}
                className="h-10 w-10 rounded-full bg-white items-center justify-center border border-white/80"
              >
                <Text className="text-[13px] font-outfit-b text-primary-700">{userInitials}</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => router.push("/(auth)/login" as never)}
                className="rounded-full bg-white px-4 py-2 active:bg-white/90"
              >
                <Text className="text-[13px] font-outfit-sb text-primary-700">Sign In</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center gap-2">
          <View className="relative flex-1">
            <View className="absolute left-3.5 z-10 top-0 bottom-0 justify-center">
              <Ionicons name="search" size={17} color="#ffffff" style={{ opacity: 0.7 }} />
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search textbooks, cycles, more..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              className="flex-1 rounded-2xl bg-black/10 border border-white/20 pl-10 pr-4 py-3 text-[14px] font-outfit text-white"
              returnKeyType="search"
            />
          </View>
          <Link href="/products" asChild>
            <Pressable className="h-[46px] w-[46px] rounded-2xl bg-black/10 border border-white/20 items-center justify-center active:bg-black/20">
              <Ionicons name="options" size={19} color="#ffffff" />
            </Pressable>
          </Link>
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ gap: 16, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 32, gap: 16 }}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#6366f1" />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-6"><Loading message="Loading more..." /></View>
          ) : null
        }
        renderItem={({ item }) => (
          <View className="flex-1 max-w-[50%]">
            <ProductCard product={item} />
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View className="py-10"><Loading /></View>
          ) : (
            <View className="px-4 py-16 items-center">
              <Text className="text-5xl mb-4">🔍</Text>
              <Text className="text-[19px] font-outfit-b text-slate-900 dark:text-white text-center">No results found</Text>
              <Text className="text-[14px] font-outfit text-slate-500 dark:text-slate-400 text-center mt-2">Try different search terms.</Text>
            </View>
          )
        }
      />
    </Screen>
  );
}
