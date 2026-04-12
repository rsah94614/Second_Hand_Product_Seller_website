import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo, useState, useCallback, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  View,
  Pressable,
  ScrollView,
} from "react-native";
import { Screen } from "../components/ui/Screen";
import { ProductCard, type ProductListItem } from "../components/ProductCard";
import { Loading } from "../components/Loading";
import { getProducts, getProductCategories } from "../lib/api/products";
import { Ionicons } from "@expo/vector-icons";

const PAGE_SIZE = 12;

export default function ProductsBrowseScreen() {
  const params = useLocalSearchParams<{
    search?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    location?: string;
    sortBy?: string;
    sortOrder?: string;
  }>();
  const [search, setSearch] = useState(typeof params.search === "string" ? params.search : "");
  const [category, setCategory] = useState(typeof params.category === "string" ? params.category : "");
  const [minPrice, setMinPrice] = useState(typeof params.minPrice === "string" ? params.minPrice : "");
  const [maxPrice, setMaxPrice] = useState(typeof params.maxPrice === "string" ? params.maxPrice : "");
  const [location, setLocation] = useState(typeof params.location === "string" ? params.location : "");
  const [sortBy, setSortBy] = useState(typeof params.sortBy === "string" ? params.sortBy : "createdAt");
  const [sortOrder, setSortOrder] = useState(typeof params.sortOrder === "string" ? params.sortOrder : "desc");
  const [showFilters, setShowFilters] = useState(
    Boolean(
      params.category ||
        params.minPrice ||
        params.maxPrice ||
        params.location ||
        (typeof params.sortBy === "string" && params.sortBy !== "createdAt") ||
        (typeof params.sortOrder === "string" && params.sortOrder !== "desc")
    )
  );

  useEffect(() => {
    if (typeof params.search === "string") setSearch(params.search);
    if (typeof params.category === "string") setCategory(params.category);
    if (typeof params.minPrice === "string") setMinPrice(params.minPrice);
    if (typeof params.maxPrice === "string") setMaxPrice(params.maxPrice);
    if (typeof params.location === "string") setLocation(params.location);
    if (typeof params.sortBy === "string") setSortBy(params.sortBy);
    if (typeof params.sortOrder === "string") setSortOrder(params.sortOrder);

    if (
      params.category ||
      params.minPrice ||
      params.maxPrice ||
      params.location ||
      (typeof params.sortBy === "string" && params.sortBy !== "createdAt") ||
      (typeof params.sortOrder === "string" && params.sortOrder !== "desc")
    ) {
      setShowFilters(true);
    }
  }, [
    params.search,
    params.category,
    params.minPrice,
    params.maxPrice,
    params.location,
    params.sortBy,
    params.sortOrder,
  ]);

  const { data: catRes } = useQuery({
    queryKey: ["product-categories"],
    queryFn: getProductCategories,
  });

  const categories = useMemo(
    () => ["All", ...(catRes?.categories?.map((c: { name: string }) => c.name) || [])],
    [catRes]
  );

  const filters = useMemo(
    () => ({
      search: search.trim(),
      category: category.trim(),
      minPrice: minPrice.trim(),
      maxPrice: maxPrice.trim(),
      location: location.trim(),
      sortBy,
      sortOrder,
    }),
    [search, category, minPrice, maxPrice, location, sortBy, sortOrder]
  );

  type Page = { products?: ProductListItem[]; nextCursor?: string | null };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
    useInfiniteQuery({
      queryKey: ["products-browse", filters],
      initialPageParam: null as string | null,
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
          if (v) params.set(k, v);
        });
        params.set("limit", String(PAGE_SIZE));
        if (pageParam) params.set("cursor", pageParam);
        return getProducts(params.toString()) as Promise<Page>;
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

  const products: ProductListItem[] = data?.pages.flatMap((p) => p.products || []) || [];

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);



  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      <View className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-10 shadow-sm shadow-slate-200/50 dark:shadow-none w-full relative">
        <View className="px-4 py-3 flex-row gap-2 w-full">
           <View className="relative flex-1 shrink">
              <View className="absolute left-3 top-3 z-10">
                 <Ionicons name="search" size={18} color="#94a3b8" />
              </View>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search textbooks, cycles, more..."
                placeholderTextColor="#94a3b8"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-3 py-2.5 text-[15px] font-outfit text-slate-900 dark:text-white"
              />
           </View>
           <Pressable 
             onPress={() => setShowFilters(!showFilters)}
             className={`px-4 rounded-xl items-center justify-center border shrink-0 ${showFilters ? 'bg-primary-50 dark:bg-primary-900/50 border-primary-200 dark:border-primary-800' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'}`}
           >
             <Ionicons name="options" size={20} color={showFilters ? '#6366f1' : '#64748b'} />
           </Pressable>
        </View>

        {showFilters && (
          <View className="px-4 pb-4 animate-fade-in">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-2 pr-4">
                {categories.slice(0, 9).map((c: string) => {
                  const isActive = c === "All" ? category === "" : category === c;
                  return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c === "All" ? "" : (isActive ? "" : c))}
                    className={`rounded-xl px-4 py-2 border ${isActive ? "bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 active:bg-slate-50"}`}
                  >
                    <Text className={`text-[13px] font-outfit-sb tracking-wide ${isActive ? "text-white" : "text-slate-700 dark:text-slate-300"}`}>
                      {c}
                    </Text>
                  </Pressable>
                )})}
              </View>
            </ScrollView>

            <View className="flex-row gap-3">
              <TextInput
                value={minPrice}
                onChangeText={setMinPrice}
                placeholder="Min Rs"
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
                className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 text-[14px] font-outfit text-slate-900 dark:text-white"
              />
              <TextInput
                value={maxPrice}
                onChangeText={setMaxPrice}
                placeholder="Max Rs"
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
                className="flex-1 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 text-[14px] font-outfit text-slate-900 dark:text-white"
              />
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Location"
                placeholderTextColor="#94a3b8"
                style={{ flex: 1.5 }}
                className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 text-[14px] font-outfit text-slate-900 dark:text-white"
              />
            </View>

            <View className="mt-3 flex-row gap-3">
              <Pressable
                onPress={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2.5 active:bg-slate-200 dark:active:bg-slate-700 border border-slate-200 dark:border-slate-700"
              >
                <Text className="text-[14px] font-outfit-sb text-slate-700 dark:text-slate-300">Sort: {sortOrder.toUpperCase()}</Text>
                <Ionicons name={sortOrder === 'desc' ? "arrow-down" : "arrow-up"} size={14} color="#64748b" />
              </Pressable>
              <Pressable
                onPress={() => setSortBy((s) => (s === "createdAt" ? "price" : "createdAt"))}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2.5 active:bg-slate-200 dark:active:bg-slate-700 border border-slate-200 dark:border-slate-700"
              >
                <Text className="text-[14px] font-outfit-sb text-slate-700 dark:text-slate-300">By {sortBy}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
      
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ gap: 16, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32, gap: 16 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#6366f1" />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-8"><Loading message="Loading more..." /></View>
          ) : null
        }
        renderItem={({ item }) => (
          <View className="flex-1 max-w-[50%]">
            <ProductCard product={item} />
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View className="py-20"><Loading /></View>
          ) : (
            <View className="px-4 py-20 flex-1 items-center justify-center">
               <Text className="text-4xl mb-4">🏜️</Text>
               <Text className="text-xl font-outfit-b text-slate-900 dark:text-white text-center">No products matches</Text>
               <Text className="text-[14px] font-outfit text-slate-500 dark:text-slate-400 text-center mt-2">Adjust filters to see more results.</Text>
            </View>
          )
        }
      />
    </Screen>
  );
}
