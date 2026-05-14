import React from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { getBlockedUsers, unblockUser } from "../../lib/api/users";
import { useToast } from "../../components/ui/AppToast";
import { Image } from "expo-image";

export default function BlockedUsersScreen() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: blockedUsers = [], isLoading, isError } = useQuery({
    queryKey: ["blocked-users"],
    queryFn: getBlockedUsers,
  });

  const unblockMutation = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      showToast("User unblocked successfully", { type: "success" });
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
    },
    onError: () => {
      showToast("Failed to unblock user", { type: "error" });
    },
  });

  if (isLoading) {
    return (
      <Screen className="bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen className="bg-slate-50 dark:bg-slate-950 items-center justify-center p-6">
        <Ionicons name="warning-outline" size={48} color="#ef4444" />
        <Text className="text-lg font-outfit-sb text-slate-900 dark:text-white mt-4 text-center">
          Failed to load blocked users.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      {blockedUsers.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <View className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mb-4">
            <Ionicons name="shield-checkmark-outline" size={32} color="#64748b" />
          </View>
          <Text className="text-xl font-outfit-b text-slate-900 dark:text-white mb-2 text-center">
            No blocked users
          </Text>
          <Text className="text-center text-slate-500 font-outfit">
            You haven&apos;t blocked anyone. Users you block will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className="flex-row items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl mb-3 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
              <View className="flex-row items-center gap-3 flex-1">
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} className="w-12 h-12 rounded-full" />
                ) : (
                  <View className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full items-center justify-center">
                    <Text className="text-lg font-outfit-b text-indigo-600 dark:text-indigo-400 uppercase">
                      {item.name?.charAt(0) || "?"}
                    </Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white" numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
              </View>
              <Button
                title="Unblock"
                variant="outline"
                onPress={() => unblockMutation.mutate(item._id)}
                loading={unblockMutation.isPending}
                className="ml-3 px-4 py-0 min-h-0 h-10 rounded-xl"
                textClassName="text-[14px]"
              />
            </View>
          )}
        />
      )}
    </Screen>
  );
}
