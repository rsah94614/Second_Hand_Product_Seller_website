import React, { useRef } from "react";
import { View, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  text: string;
  setText: (t: string) => void;
  onSend: (content: string) => void;
  onSendImage: (uri: string, mime: string) => void;
  onTyping: () => void;
  editingMessageId: string | null;
  onCancelEdit: () => void;
  sendingImage: boolean;
  isConnected: boolean;
};

export function ChatInputArea({
  text,
  setText,
  onSend,
  onSendImage,
  onTyping,
  editingMessageId,
  onCancelEdit,
  sendingImage,
  isConnected,
}: Props) {
  const insets = useSafeAreaInsets();
  const lastTypingAtRef = useRef(0);

  const notifyTyping = () => {
    const now = Date.now();
    if (now - lastTypingAtRef.current < 1200) return;
    lastTypingAtRef.current = now;
    onTyping();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      onSendImage(result.assets[0].uri, result.assets[0].mimeType || "image/jpeg");
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <View
      className="px-4 pt-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {editingMessageId && (
        <View className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-xl mb-3 border-l-4 border-primary-500">
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5 mb-0.5">
              <Ionicons name="pencil" size={12} color="#6366f1" />
              <View className="bg-primary-100 dark:bg-primary-900/30 px-1.5 py-0.5 rounded-md">
                <View className="flex-row items-center gap-1">
                  <View className="h-1 w-1 rounded-full bg-primary-600" />
                  <View className="h-1 w-1 rounded-full bg-primary-600" />
                  <View className="h-1 w-1 rounded-full bg-primary-600" />
                </View>
              </View>
            </View>
          </View>
          <Pressable onPress={onCancelEdit} className="p-1">
            <Ionicons name="close-circle" size={20} color="#94a3b8" />
          </Pressable>
        </View>
      )}

      <View className="flex-row items-end gap-2">
        <Pressable
          onPress={pickImage}
          disabled={sendingImage}
          className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 active:bg-slate-200"
        >
          {sendingImage ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : (
            <Ionicons name="image-outline" size={22} color="#6366f1" />
          )}
        </Pressable>

        <View className="flex-1 min-h-[44px] max-h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 justify-center">
          <TextInput
            value={text}
            onChangeText={(t) => {
              setText(t);
              notifyTyping();
            }}
            placeholder={isConnected ? "Message..." : "Message when back online..."}
            placeholderTextColor="#94a3b8"
            multiline
            scrollEnabled
            maxLength={2000}
            blurOnSubmit={false}
            className="px-4 py-2.5 text-[15px] font-outfit text-slate-900 dark:text-white"
            style={{ minHeight: 44, maxHeight: 96, textAlignVertical: "top", paddingTop: 10, paddingBottom: 10 }}
          />
        </View>

        <Pressable
          onPress={handleSend}
          disabled={!text.trim()}
          className={`h-11 w-11 items-center justify-center rounded-2xl ${text.trim() ? "bg-primary-600 shadow-md shadow-primary-200" : "bg-slate-200 dark:bg-slate-800"
            }`}
        >
          <Ionicons
            name={editingMessageId ? "checkmark" : "send"}
            size={18}
            color={text.trim() ? "#fff" : "#94a3b8"}
          />
        </Pressable>
      </View>
    </View>
  );
}
