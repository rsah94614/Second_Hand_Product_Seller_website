import { useQuery } from "@tanstack/react-query";
import { Link, Redirect } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { EmptyState } from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { getOrders } from "../../lib/api/orders";
import { formatInr } from "../../lib/format";
import { Ionicons } from "@expo/vector-icons";

type OrderRow = {
  _id: string;
  status: string;
  total: number;
  items?: { product?: string; title?: string }[];
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    enabled: !!user,
  });

  if (!user) return <Redirect href="/(auth)/login" />;

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
          title="Failed to load orders"
          message="Please try again and we will fetch your orders."
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      </Screen>
    );
  }

  const orders: OrderRow[] = Array.isArray(data) ? data : data?.orders || [];

  return (
    <Screen>
      <FlatList
        data={orders}
        keyExtractor={(o) => o._id}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            title="No orders yet"
            message="When you buy something, your orders will appear here."
          />
        }
        renderItem={({ item: o }) => {
          const first = o.items?.[0];
          const productId = first?.product ? String(first.product) : "";

          return (
            <View className="mb-4 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none">
              <View className="flex-row justify-between items-start mb-3">
                 <View className="flex-1 pr-4">
                    <Text className="text-[17px] font-outfit-sb text-slate-900 dark:text-white leading-tight">
                       {first?.title || "Order"}
                    </Text>
                 </View>
                 <Text className="text-lg font-outfit-b text-primary-600 dark:text-primary-400">{formatInr(o.total)}</Text>
              </View>
              
              <View className="flex-row justify-between items-center mt-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                 <View className={`px-2.5 py-1 rounded-lg ${
                   o.status?.toLowerCase() === "delivered" ? "bg-green-100 dark:bg-green-900/30" :
                   o.status?.toLowerCase() === "processing" ? "bg-amber-100 dark:bg-amber-900/30" :
                   o.status?.toLowerCase() === "cancelled" ? "bg-red-100 dark:bg-red-900/30" :
                   "bg-slate-100 dark:bg-slate-800"
                 }`}>
                    <Text className={`text-[12px] font-outfit-sb uppercase tracking-wider ${
                      o.status?.toLowerCase() === "delivered" ? "text-green-700 dark:text-green-400" :
                      o.status?.toLowerCase() === "processing" ? "text-amber-700 dark:text-amber-400" :
                      o.status?.toLowerCase() === "cancelled" ? "text-red-700 dark:text-red-400" :
                      "text-slate-700 dark:text-slate-300"
                    }`}>{o.status}</Text>
                 </View>
                 
                 {productId ? (
                   <Link href={`/order/${productId}` as never} asChild>
                     <Pressable className="flex-row items-center gap-1 active:opacity-70">
                       <Text className="font-outfit-sb text-primary-600 dark:text-primary-400">View Details</Text>
                       <Ionicons name="chevron-forward" size={16} color="#4f46e5" />
                     </Pressable>
                   </Link>
                 ) : null}
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}
