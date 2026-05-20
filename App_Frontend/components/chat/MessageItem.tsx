import React, { memo } from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { Msg } from "../../lib/types";

const SCREEN_WIDTH = Dimensions.get("window").width;
// Image fills up to 72% of screen width so it stays within the 85% bubble cap
const IMAGE_WIDTH = Math.min(260, SCREEN_WIDTH * 0.72);

type Props = {
  message: Msg;
  isMine: boolean;
  showDate: boolean;
  formattedTime: string;
  onLongPress: (message: Msg) => void;
  onImagePress?: (uri: string) => void;
};

export const MessageItem = memo(({ message, isMine, showDate, formattedTime, onLongPress, onImagePress }: Props) => {
  const getMessageDate = (msg: Msg) => {
    const time = msg.createdAt || msg.timestamp || new Date().toISOString();
    return new Date(time).toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <View className="mb-4">
      {showDate && (
        <View className="items-center mb-4 mt-2">
          <View className="bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">
            <Text className="text-[11px] font-outfit-m text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {getMessageDate(message)}
            </Text>
          </View>
        </View>
      )}

      <View className={`flex-row ${isMine ? "justify-end" : "justify-start"}`}>
        {/* shrink + min-w-0 lets the flex child actually honour max-w-[85%] */}
        <View style={{ maxWidth: "85%", flexShrink: 1, alignItems: isMine ? "flex-end" : "flex-start" }}>
          <Pressable
            onLongPress={() => onLongPress(message)}
            delayLongPress={200}
            className={`px-4 py-3 rounded-3xl ${
              isMine
                ? "bg-primary-600 rounded-tr-none"
                : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-tl-none shadow-sm"
            }`}
          >
            {message.image ? (
              <Pressable
                onPress={() => onImagePress?.(message.image!)}
                style={{ marginBottom: 6, borderRadius: 12, overflow: "hidden" }}
                className="bg-slate-100 dark:bg-slate-800 active:opacity-90"
              >
                <Image
                  source={{ uri: message.image }}
                  style={{ width: IMAGE_WIDTH, aspectRatio: 4 / 3 }}
                  contentFit="cover"
                  transition={200}
                />
              </Pressable>
            ) : null}

            {message.content ? (
              <Text
                selectable
                className={`text-[15px] font-outfit leading-relaxed ${
                  isMine ? "text-white" : "text-slate-900 dark:text-white"
                } ${message.isDeleted ? "italic opacity-50" : ""}`}
                style={{ flexShrink: 1, flexWrap: "wrap" }}
              >
                {message.isDeleted ? "This message was deleted" : message.content}
              </Text>
            ) : null}

            <View className="flex-row flex-wrap items-center justify-end mt-1 gap-1">
              <Text
                className={`text-[10px] font-outfit ${
                  isMine ? "text-primary-100/80" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {formattedTime}
                {message.isEdited && !message.isDeleted ? " • Edited" : ""}
              </Text>

              {isMine && !message.isDeleted && (
                <Ionicons
                  name={message.read ? "checkmark-done" : message.delivered ? "checkmark-done" : "checkmark"}
                  size={12}
                  color={message.read ? "#93c5fd" : "#cbd5e1"}
                />
              )}
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

MessageItem.displayName = "MessageItem";
