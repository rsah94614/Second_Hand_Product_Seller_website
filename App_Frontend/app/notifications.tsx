import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Redirect, router } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { Screen } from "../components/ui/Screen";
import { Loading } from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/EmptyState";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  snoozeNotification,
} from "../lib/api/notifications";
import { notificationLinkToHref } from "../lib/notificationLink";
import { Ionicons } from "@expo/vector-icons";

type Notif = {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead?: boolean;
  link?: string;
  createdAt: string;
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["notifications-list"],
    queryFn: () => getNotifications({ page: 1, limit: 50 }),
    enabled: !!user,
  });

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  const snoozeM = useMutation({
    mutationFn: ({ id, duration }: { id: string; duration: "1h" | "1d" | "1w" }) =>
      snoozeNotification(id, duration),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications-list"] }),
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

  const list: Notif[] = data?.notifications || [];

  const open = async (n: Notif) => {
    if (!n.isRead) {
      await markOne.mutateAsync(n._id);
    }
    const href = n.link ? notificationLinkToHref(n.link) : null;
    if (href) {
      router.push(href as never);
    }
  };

  const getIcon = (type: string) => {
     if (type.includes("ORDER")) return <Ionicons name="cart" size={24} color="#6366f1" />;
     if (type.includes("CHAT")) return <Ionicons name="chatbubble-ellipses" size={24} color="#10b981" />;
     if (type.includes("SECURITY")) return <Ionicons name="shield-checkmark" size={24} color="#ef4444" />;
     return <Ionicons name="notifications" size={24} color="#6366f1" />;
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5">
        <Text className="text-[20px] font-outfit-b text-slate-900 dark:text-white">Activity</Text>
        <Pressable onPress={() => markAll.mutate()} disabled={markAll.isPending} className="bg-primary-50 dark:bg-primary-950/30 px-3 py-1.5 rounded-full">
          <Text className="text-[12px] font-outfit-b text-primary-600 dark:text-primary-400 uppercase tracking-widest">Mark All Read</Text>
        </Pressable>
      </View>
      <FlatList
        data={list}
        keyExtractor={(n) => n._id}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<View className="py-20"><EmptyState title="All Caught Up!" message="You have no new notifications right now." /></View>}
        renderItem={({ item: n }) => (
          <Pressable
            onPress={() => open(n)}
            className={`mb-3 flex-row items-start rounded-3xl border p-4 active:scale-[0.98] transition-transform ${
              n.isRead 
                ? "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm shadow-slate-100/50 dark:shadow-none" 
                : "border-primary-100 dark:border-primary-900 bg-primary-50/50 dark:bg-primary-950/20"
            }`}
          >
            <View className={`h-12 w-12 rounded-full items-center justify-center mr-4 ${n.isRead ? 'bg-slate-100 dark:bg-slate-800' : 'bg-primary-100 dark:bg-primary-900/40'}`}>
               {getIcon(n.type)}
            </View>
            <View className="flex-1">
              <Text className={`text-[16px] font-outfit-sb ${n.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>{n.title}</Text>
              <Text className={`mt-1 text-[14px] font-outfit ${n.isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'} leading-snug`}>{n.message}</Text>
              <Text className="mt-2 text-[11px] font-outfit-m uppercase tracking-widest text-slate-400 dark:text-slate-500">{n.type?.replace(/_/g, " ")}</Text>
              {/* Snooze buttons */}
              <View className="flex-row gap-2 mt-2">
                {(["1h", "1d", "1w"] as const).map((d) => (
                  <Pressable
                    key={d}
                    onPress={(e) => { e.stopPropagation?.(); snoozeM.mutate({ id: n._id, duration: d }); }}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800"
                  >
                    <Text className="text-[10px] font-outfit-sb text-slate-500 dark:text-slate-400">
                      {d === "1h" ? "1h" : d === "1d" ? "1d" : "1w"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            {!n.isRead && <View className="h-2.5 w-2.5 rounded-full bg-primary-500 mt-2" />}
          </Pressable>
        )}
      />
    </Screen>
  );
}
