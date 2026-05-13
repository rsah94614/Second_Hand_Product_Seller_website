import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Screen } from "../components/ui/Screen";
import { Loading } from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/EmptyState";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
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
  const { user, loading: authLoading } = useAuth();
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


  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/(auth)/login");
    }
  }, [authLoading, user]);

  if (authLoading || !user) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
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

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    if (type.includes("ORDER")) return <Ionicons name="cart" size={20} color="#6366f1" />;
    if (type.includes("CHAT")) return <Ionicons name="chatbubble-ellipses" size={20} color="#10b981" />;
    if (type.includes("SECURITY")) return <Ionicons name="shield-checkmark" size={20} color="#ef4444" />;
    return <Ionicons name="notifications" size={20} color="#6366f1" />;
  };

  return (
    <Screen safeAreaTop={false}>
      <View className="flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4">
        <Text className="text-[22px] font-outfit-bl text-slate-900 dark:text-white">Activity</Text>
        <Pressable onPress={() => markAll.mutate()} disabled={markAll.isPending} className="active:opacity-60">
          <Text className="text-[13px] font-outfit-sb text-primary-600 dark:text-primary-400">Mark all read</Text>
        </Pressable>
      </View>
      <FlatList
        data={list}
        keyExtractor={(n) => n._id}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="py-20">
            <EmptyState title="All Caught Up!" message="You have no new notifications right now." />
          </View>
        }
        renderItem={({ item: n }) => (
          <Pressable
            onPress={() => open(n)}
            className="flex-row items-start px-5 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 active:bg-slate-50 dark:active:bg-slate-800/50"
          >
            <View className="h-12 w-12 rounded-full items-center justify-center mr-4 bg-slate-50 dark:bg-slate-800/50">
              {getIcon(n.type)}
            </View>
            <View className="flex-1">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-4">
                  <Text
                    className={`text-[16px] ${n.isRead ? "font-outfit-sb text-slate-700 dark:text-slate-300" : "font-outfit-b text-slate-900 dark:text-white"
                      }`}
                  >
                    {n.title}
                  </Text>
                </View>
                {!n.isRead && <View className="h-2.5 w-2.5 rounded-full bg-primary-500 mt-1.5" />}
              </View>
              <Text
                className={`mt-1 text-[14px] font-outfit ${n.isRead ? "text-slate-500 dark:text-slate-400" : "text-slate-700 dark:text-slate-300"
                  } leading-snug`}
              >
                {n.message}
              </Text>

              <View className="flex-row items-center justify-between mt-4">
                <View className="flex-row items-center gap-2">
                  <Text className="text-[10px] font-outfit-sb uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {n.type?.replace(/_/g, " ")}
                  </Text>
                  <Text className="text-[10px] text-slate-300 dark:text-slate-700">•</Text>
                  <Text className="text-[11px] font-outfit-m text-slate-500 dark:text-slate-400">
                    {formatTimeAgo(n.createdAt)}
                  </Text>
                </View>

                {/* Visual indicator for new notifications */}
                {!n.isRead && (
                  <View className="px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/30">
                    <Text className="text-[10px] font-outfit-b text-primary-600 dark:text-primary-400">NEW</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

