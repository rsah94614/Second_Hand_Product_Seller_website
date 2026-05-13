import React, { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { Msg } from "../../lib/types";

type Props = {
  message: Msg;
  isMine: boolean;
  showDate: boolean;
  formattedTime: string;
  onLongPress: (message: Msg) => void;
};

export const MessageItem = memo(({ message, isMine, showDate, formattedTime, onLongPress }: Props) => {
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
        <View className={`max-w-[85%] ${isMine ? "items-end" : "items-start"}`}>
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
              <View className="mb-2 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                <Image
                  source={{ uri: message.image }}
                  style={{ width: 220, aspectRatio: 3 / 4 }}
                  contentFit="cover"
                  transition={200}
                />
              </View>
            ) : null}

            {message.content ? (
              <Text
                className={`text-[16px] font-outfit leading-normal ${
                  isMine ? "text-white" : "text-slate-900 dark:text-white"
                } ${message.isDeleted ? "italic opacity-50" : ""}`}
              >
                {message.isDeleted ? "This message was deleted" : message.content}
              </Text>
            ) : null}

            <View className="flex-row items-center justify-end mt-1 gap-1">
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
