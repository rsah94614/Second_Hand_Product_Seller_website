import React from "react";
import { Pressable, Alert } from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  partnerName: string;
  isPinned: boolean;
  onTogglePin: () => void;
  onBlock: () => void;
  onReport: () => void;
  isDark: boolean;
};

export function ChatHeader({ partnerName, isPinned, onTogglePin, onBlock, onReport, isDark }: Props) {
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
      {
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
      },
      { text: "Cancel", style: "cancel" },
    ], { cancelable: true });
  };

  return (
    <Stack.Screen
      options={{
        title: partnerName,
        headerRight: () => (
          <Pressable onPress={openActions} className="p-2 mr-1 active:opacity-60">
            <Ionicons name="ellipsis-vertical" size={20} color={isDark ? "#fff" : "#1e293b"} />
          </Pressable>
        ),
      }}
    />
  );
}
