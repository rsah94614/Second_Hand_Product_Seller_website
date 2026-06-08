import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { getAdminDisputes } from "../../lib/api/admin";
import { Ionicons } from "@expo/vector-icons";

export default function AdminDisputesScreen() {
  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ["admin-disputes"],
    queryFn: getAdminDisputes,
  });

  if (isLoading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  const renderItem = ({ item }: { item: any }) => {
    let bgClass = "bg-amber-100 dark:bg-amber-900/30";
    let textClass = "text-amber-700 dark:text-amber-400";
    
    if (item.status === "resolved") {
      bgClass = "bg-green-100 dark:bg-green-900/30";
      textClass = "text-green-700 dark:text-green-400";
    } else if (item.status === "rejected") {
      bgClass = "bg-red-100 dark:bg-red-900/30";
      textClass = "text-red-700 dark:text-red-400";
    }

    return (
      <Link href={`/admin/dispute/${item._id}`} asChild>
        <Pressable className="mb-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none active:opacity-80">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 mr-3">
              <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400">Order #{item.order?._id?.slice(-6) || "Unknown"}</Text>
              <Text className="text-[15px] font-outfit-sb text-slate-900 dark:text-white capitalize mt-0.5" numberOfLines={1}>
                {item.reason?.replace(/_/g, " ")}
              </Text>
            </View>
            <View className={`px-2 py-1 rounded-md ${bgClass}`}>
              <Text className={`text-[10px] font-outfit-sb uppercase ${textClass}`}>
                {item.status}
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center gap-2 mt-2">
            <Ionicons name="person-outline" size={14} color="#94a3b8" />
            <Text className="text-[13px] font-outfit text-slate-600 dark:text-slate-400 flex-1" numberOfLines={1}>
              {item.initiatedBy?.name || "Unknown User"}
            </Text>
            <Text className="text-[11px] font-outfit text-slate-400">
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </Pressable>
      </Link>
    );
  };

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950" safeAreaTop={false}>
      <FlatList
        data={disputes}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerClassName="p-4"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="shield-checkmark-outline" size={48} color="#94a3b8" />
            <Text className="text-[16px] font-outfit-sb text-slate-700 dark:text-slate-300 mt-4">No disputes found</Text>
            <Text className="text-[14px] font-outfit text-slate-500 dark:text-slate-400 mt-1 text-center px-6">
              There are currently no disputes raised by users.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
