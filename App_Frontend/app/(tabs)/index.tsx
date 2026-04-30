import { useQuery } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { ScrollView, Text, View, Pressable, TextInput, RefreshControl } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { ProductCard, type ProductListItem } from "../../components/ProductCard";
import { getProducts, getProductCategories } from "../../lib/api/products";
import { getRecentlyViewed } from "../../lib/api/users";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

// ─── Category meta ────────────────────────────────────────────────────────────
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

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  accentColor = "text-primary-600 dark:text-primary-400",
}: {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  accentColor?: string;
}) {
  return (
    <View className="flex-row items-end justify-between px-5 mb-3">
      <View className="flex-1 pr-4">
        <Text className="text-[18px] font-outfit-b text-slate-900 dark:text-white leading-tight">{title}</Text>
        {subtitle ? (
          <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={2}>{subtitle}</Text>
        ) : null}
      </View>
      {viewAllHref ? (
        <Link href={viewAllHref as never} asChild>
          <Pressable>
            <Text className={`text-[13px] font-outfit-sb ${accentColor}`}>View All</Text>
          </Pressable>
        </Link>
      ) : null}
    </View>
  );
}

// ─── Horizontal product row ───────────────────────────────────────────────────
function ProductRow({ products, isLoading }: { products: ProductListItem[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {[...Array(3)].map((_, i) => (
          <View key={i} className="w-44 h-56 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </ScrollView>
    );
  }
  if (!products.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
      {products.map((p) => (
        <View key={p._id} style={{ width: 176 }}>
          <ProductCard product={p} />
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  // Categories
  const { data: catRes } = useQuery({
    queryKey: ["product-categories"],
    queryFn: getProductCategories,
    staleTime: 5 * 60 * 1000,
  });
  const categories: string[] =
    catRes?.categories?.map((c: { name: string }) => c.name).slice(0, 10) ||
    ["Electronics", "Books & Study Materials", "Cycles", "Fashion & Clothing", "Hostel Essentials", "Sports & Fitness"];

  // Latest products
  const { data: latestData, isLoading: latestLoading, refetch: refetchLatest, isRefetching } = useQuery({
    queryKey: ["home-latest"],
    queryFn: () => getProducts("limit=8&sortBy=createdAt&sortOrder=desc"),
    staleTime: 3 * 60 * 1000,
  });

  // Budget picks
  const { data: budgetData, isLoading: budgetLoading } = useQuery({
    queryKey: ["home-budget"],
    queryFn: () => getProducts("limit=8&sortBy=price&sortOrder=asc"),
    staleTime: 3 * 60 * 1000,
  });

  // Recently viewed (logged-in only)
  const { data: recentlyViewedData } = useQuery({
    queryKey: ["home-recently-viewed"],
    queryFn: getRecentlyViewed,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const latestProducts: ProductListItem[] = latestData?.products || [];
  const budgetProducts: ProductListItem[] = budgetData?.products || [];
  const recentlyViewed: ProductListItem[] = (recentlyViewedData?.products || []).slice(0, 6);

  const liveCount = latestData?.total ?? 0;
  const budgetCount = budgetProducts.length;

  const handleSearch = () => {
    if (search.trim()) {
      router.push(`/products?search=${encodeURIComponent(search.trim())}` as never);
    }
  };

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      {/* ── Top Header ── */}
      <View className="bg-primary-600 dark:bg-primary-900 px-5 pb-3 pt-4 z-10">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-[12px] font-outfit-m text-primary-200 uppercase tracking-widest">
              {user ? `Hey, ${user.name?.split(" ")[0]}` : "Welcome to"}
            </Text>
            <Text className="text-[24px] font-outfit-bl text-white leading-tight">Campus Mitra</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push("/notifications" as never)}
              className="h-10 w-10 rounded-full bg-white/20 items-center justify-center border border-white/10 active:bg-white/30"
            >
              <Ionicons name="notifications-outline" size={19} color="#ffffff" />
            </Pressable>
            {!user && (
              <Pressable
                onPress={() => router.push("/(auth)/login" as never)}
                className="rounded-full bg-white px-4 py-2 active:bg-white/90"
              >
                <Text className="text-[13px] font-outfit-sb text-primary-700">Sign In</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Search bar */}
        <Pressable
          onPress={handleSearch}
          className="flex-row items-center gap-2 rounded-2xl bg-black/10 border border-white/20 pl-4 pr-3 h-12 active:bg-black/20"
        >
          <Ionicons name="search" size={17} color="rgba(255,255,255,0.7)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            placeholder="Search products, categories..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            className="flex-1 text-[14px] font-outfit text-white"
            returnKeyType="search"
          />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetchLatest} />}
      >
        {/* ── Hero Banner ── */}
        <View className="mx-4 mt-4 mb-5 rounded-3xl overflow-hidden bg-slate-900" style={{ minHeight: 170 }}>
          <View className="absolute inset-0 bg-indigo-950 opacity-95" />
          <View
            className="absolute top-[-40%] left-[-10%] w-[60%] h-[200%] rounded-full opacity-40"
            style={{ backgroundColor: "rgba(99,102,241,0.35)" }}
          />
          <View
            className="absolute bottom-[-30%] right-[-10%] w-[50%] h-[160%] rounded-full opacity-30"
            style={{ backgroundColor: "rgba(34,211,238,0.35)" }}
          />
          <View className="relative z-10 p-6">
            <View className="flex-row items-center gap-2 mb-4 self-start bg-white/10 border border-white/15 px-3 py-1.5 rounded-full">
              <View className="h-2 w-2 rounded-full bg-cyan-400" />
              <Text className="text-[11px] font-outfit-sb text-white/80">CampusMitra Marketplace</Text>
            </View>
            <Text className="text-[22px] font-outfit-bl text-white leading-tight mb-2">
              Buy campus essentials{"\n"}before they&apos;re gone.
            </Text>
            <Text className="text-[13px] font-outfit text-white/60 mb-5">
              Student-to-student deals, fresh listings every day.
            </Text>
            <View className="flex-row gap-2 flex-wrap">
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

        {/* ── Categories ── */}
        <SectionHeader title="Browse by Category" viewAllHref="/products" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 4 }}
          className="mb-6"
        >
          {categories.map((cat, i) => {
            const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
            const emoji = CATEGORY_EMOJI[cat] || "📦";
            return (
              <Pressable
                key={cat}
                onPress={() => router.push(`/products?category=${encodeURIComponent(cat)}` as never)}
                className={`self-start items-center rounded-2xl px-4 py-3 min-w-[80px] active:opacity-80 ${color.bg}`}
              >
                <Text className="text-2xl mb-1">{emoji}</Text>
                <Text className={`text-[11px] font-outfit-sb text-center leading-tight ${color.text}`} numberOfLines={2}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Latest Products ── */}
        <SectionHeader
          title="Latest Listings"
          subtitle="Fresh listings from across the marketplace."
          viewAllHref="/products"
          accentColor="text-primary-600 dark:text-primary-400"
        />
        <View className="mb-6">
          <ProductRow products={latestProducts} isLoading={latestLoading} />
        </View>

        {/* ── Budget Picks ── */}
        <SectionHeader
          title="Budget Picks"
          subtitle="Affordable listings — practical deals without digging."
          viewAllHref={"/products?sortBy=price&sortOrder=asc" as never}
          accentColor="text-amber-600 dark:text-amber-400"
        />
        <View className="mb-6">
          <ProductRow products={budgetProducts} isLoading={budgetLoading} />
        </View>

        {/* ── Recently Viewed (logged-in only) ── */}
        {user && recentlyViewed.length > 0 && (
          <>
            <SectionHeader
              title="Pick Up Where You Left Off"
              subtitle="Products you explored recently."
              viewAllHref="/products"
              accentColor="text-violet-600 dark:text-violet-400"
            />
            <View className="mb-6">
              <ProductRow products={recentlyViewed} isLoading={false} />
            </View>
          </>
        )}

        {/* ── Stats Band ── */}
        <View className="mx-4 mb-6 rounded-3xl overflow-hidden bg-slate-900">
          <View className="absolute inset-0 bg-indigo-950 opacity-95" />
          <View
            className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20"
            style={{ backgroundColor: "rgba(34,211,238,0.5)" }}
          />
          <View className="relative z-10 flex-row divide-x divide-white/10">
            {[
              { icon: "flash-outline" as const, value: liveCount, label: "Live Listings", color: "text-cyan-300" },
              { icon: "pricetag-outline" as const, value: budgetCount, label: "Budget Picks", color: "text-amber-300" },
              { icon: "grid-outline" as const, value: categories.length, label: "Categories", color: "text-emerald-300" },
            ].map((s) => (
              <View key={s.label} className="flex-1 items-center py-6 px-2">
                <View className="h-10 w-10 rounded-2xl bg-white/10 items-center justify-center mb-2">
                  <Ionicons name={s.icon} size={20} color={s.color === "text-cyan-300" ? "#67e8f9" : s.color === "text-amber-300" ? "#fcd34d" : "#6ee7b7"} />
                </View>
                <Text className={`text-[26px] font-outfit-bl ${s.color}`}>{s.value}</Text>
                <Text className="text-[10px] font-outfit-sb text-white/50 uppercase tracking-widest text-center mt-0.5">{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Feature tags ── */}
        {/* <View className="flex-row flex-wrap gap-2 px-5 mb-4">
          {["Fresh listings", "Budget-friendly picks", "Student-to-student deals"].map((tag) => (
            <View key={tag} className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-1.5">
              <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400">{tag}</Text>
            </View>
          ))}
        </View> */}
      </ScrollView>
    </Screen>
  );
}
