import React, { useRef, useState, useEffect, memo } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Keyboard, Platform, Appearance, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

type Props = {
  initialText?: string;
  onSend: (content: string) => void;
  onSendImage: (uri: string, mime: string) => void;
  onTyping: () => void;
  editingMessageId: string | null;
  onCancelEdit: () => void;
  sendingImage: boolean;
  isConnected: boolean;
};

/**
 * ChatInputArea
 * 
 * Optimized to handle local state. Typing here will NOT re-render
 * the entire chat thread, preventing navigation context crashes.
 */
export const ChatInputArea = memo(({
  initialText = "",
  onSend,
  onSendImage,
  onTyping,
  editingMessageId,
  onCancelEdit,
  sendingImage,
  isConnected,
}: Props) => {
  const [localText, setLocalText] = useState(initialText);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string, mime: string } | null>(null);
  const lastTypingAtRef = useRef(0);
  const colorScheme = Appearance.getColorScheme();
  const isDark = colorScheme === "dark";

  // Sync with editing changes
  useEffect(() => {
    setLocalText(initialText);
  }, [initialText]);

  const notifyTyping = () => {
    const now = Date.now();
    if (now - lastTypingAtRef.current < 1200) return;
    lastTypingAtRef.current = now;
    onTyping();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage({
        uri: result.assets[0].uri,
        mime: result.assets[0].mimeType || "image/jpeg"
      });
    }
  };

  const handleConfirmSendImage = () => {
    if (selectedImage) {
      onSendImage(selectedImage.uri, selectedImage.mime);
      setSelectedImage(null);
    }
  };

  const handleSend = () => {
    if (!localText.trim()) return;
    onSend(localText);
    setLocalText("");
  };

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardOpen(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardOpen(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const styles = {
    container: {
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
      borderTopWidth: 1,
      borderTopColor: isDark ? "#1e293b" : "#f1f5f9",
      paddingBottom: isKeyboardOpen ? 12 : 24,
    },
    editToolbar: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      backgroundColor: isDark ? "rgba(30, 41, 59, 0.5)" : "#f8fafc",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: "#6366f1",
    },
    inputRow: {
      flexDirection: "row" as const,
      alignItems: "flex-end" as const,
      gap: 8,
    },
    iconBtn: {
      height: 44,
      width: 44,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderRadius: 16,
      backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
    },
    inputContainer: {
      flex: 1,
      minHeight: 44,
      maxHeight: 128,
      backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "#334155" : "#e2e8f0",
      justifyContent: "center" as const,
    },
    textInput: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      fontFamily: "Outfit-Regular",
      color: isDark ? "#ffffff" : "#0f172a",
      minHeight: 44,
      maxHeight: 96,
      textAlignVertical: "top" as const,
    },
    sendBtn: (enabled: boolean) => ({
      height: 44,
      width: 44,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderRadius: 16,
      backgroundColor: enabled ? "#6366f1" : (isDark ? "#1e293b" : "#e2e8f0"),
      // Shadow for enabled state
      ...(enabled ? {
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      } : {}),
    }),
    previewModal: {
      flex: 1,
      backgroundColor: "#000",
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    previewActions: {
      position: "absolute" as const,
      bottom: 40,
      left: 0,
      right: 0,
      flexDirection: "row" as const,
      justifyContent: "space-around" as const,
      paddingHorizontal: 20,
    },
    previewBtn: (color: string) => ({
      height: 56,
      paddingHorizontal: 32,
      borderRadius: 28,
      backgroundColor: color,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    }),
  };

  return (
    <View style={styles.container}>
      {/* Image Preview Modal */}
      <Modal 
        visible={!!selectedImage} 
        transparent 
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.previewModal}>
          {selectedImage && (
            <Image 
              source={{ uri: selectedImage.uri }} 
              style={{ width: "100%", height: "70%" }} 
            />
          )}
          <View style={styles.previewActions}>
            <Pressable 
              onPress={() => setSelectedImage(null)}
              style={styles.previewBtn("#1e293b")}
            >
              <Ionicons name="close" size={24} color="#fff" />
              <Text style={{ color: "#fff", fontFamily: "Outfit-Bold" }}>Cancel</Text>
            </Pressable>
            <Pressable 
              onPress={handleConfirmSendImage}
              style={styles.previewBtn("#6366f1")}
            >
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={{ color: "#fff", fontFamily: "Outfit-Bold" }}>Send Photo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {editingMessageId && (
        <View style={styles.editToolbar}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="pencil" size={12} color="#6366f1" />
              <Text style={{ fontSize: 12, fontFamily: "Outfit-Medium", color: isDark ? "#94a3b8" : "#64748b" }}>
                Editing message...
              </Text>
            </View>
          </View>
          <Pressable onPress={onCancelEdit} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={20} color="#94a3b8" />
          </Pressable>
        </View>
      )}

      <View style={styles.inputRow}>
        <Pressable
          onPress={pickImage}
          disabled={sendingImage}
          style={styles.iconBtn}
        >
          {sendingImage ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : (
            <Ionicons name="image-outline" size={22} color="#6366f1" />
          )}
        </Pressable>

        <View style={styles.inputContainer}>
          <TextInput
            value={localText}
            onChangeText={(t) => {
              setLocalText(t);
              notifyTyping();
            }}
            placeholder={isConnected ? "Message..." : "Message when back online..."}
            placeholderTextColor="#94a3b8"
            multiline
            scrollEnabled
            maxLength={2000}
            blurOnSubmit={false}
            style={styles.textInput}
          />
        </View>

        <Pressable
          onPress={handleSend}
          disabled={!localText.trim()}
          style={styles.sendBtn(!!localText.trim())}
        >
          <Ionicons
            name={editingMessageId ? "checkmark" : "send"}
            size={18}
            color={localText.trim() ? "#fff" : "#94a3b8"}
          />
        </Pressable>
      </View>
    </View>
  );
});

ChatInputArea.displayName = "ChatInputArea";
