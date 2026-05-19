import React from "react";
import { Pressable, Alert, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  partnerName: string;
  isPinned: boolean;
  onTogglePin: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  isBlocked: boolean;
  onReport: () => void;
  isDark: boolean;
};

export function ChatHeader({ partnerName, isPinned, onTogglePin, onBlock, onUnblock, isBlocked, onReport, isDark }: Props) {
  const insets = useSafeAreaInsets();
  const iconColor = isDark ? "#fff" : "#1e293b";

  const openActions = () => {
    Alert.alert(partnerName, "Chat actions", [
      {
        text: isPinned ? "Unpin conversation" : "Pin conversation",
        onPress: onTogglePin,
      },
      {
        text: "Report chat",
        onPress: onReport,
      },
      !isBlocked ? {
        text: "Block user",
        style: "destructive",
        onPress: () => {
          Alert.alert("Block user", "You will no longer receive messages from this user. Continue?", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Block",
              style: "destructive",
              onPress: onBlock,
            },
          ], { cancelable: true });
        },
      } : {
        text: "Unblock user",
        onPress: onUnblock,
      },
      { text: "Cancel", style: "cancel" },
    ], { cancelable: true });
  };

  return (
    <View
      className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800"
      style={{ paddingTop: insets.top }}
    >
      <View className="h-14 flex-row items-center px-3">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800"
        >
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </Pressable>

        <Text
          numberOfLines={1}
          className="flex-1 px-2 text-[19px] font-outfit-sb text-slate-900 dark:text-white"
        >
          {partnerName}
        </Text>

        <Pressable
          onPress={openActions}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800"
        >
          <Ionicons name="ellipsis-vertical" size={20} color={iconColor} />
        </Pressable>
      </View>
    </View>
  );
}
