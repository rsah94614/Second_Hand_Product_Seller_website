import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getConversationMessages, markConversationAsRead, reportChatUser, uploadChatImage } from "../../lib/api/chat";
import { Ionicons } from "@expo/vector-icons";
import { blockUser } from "../../lib/api/users";

type Msg = {
  _id: string;
  content?: string;
  image?: string;
  sender: unknown;
  receiver: unknown;
  timestamp?: string;
  createdAt?: string;
  read?: boolean;
  isDeleted?: boolean;
};

const getId = (v: unknown) => (typeof v === "object" && v && "_id" in v ? String((v as { _id: string })._id) : String(v || ""));
const getName = (v: unknown) =>
  typeof v === "object" && v && "name" in v ? String((v as { name?: string }).name || "") : "";

export default function ChatThreadScreen() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>();
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const listRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const partnerId = String(userId || "");
  const partnerName =
    messages
      .map((message) => {
        const senderId = getId(message.sender);
        const receiverId = getId(message.receiver);
        if (senderId === partnerId) return getName(message.sender);
        if (receiverId === partnerId) return getName(message.receiver);
        return "";
      })
      .find(Boolean) || (name ? String(name) : "Chat");

  const openActions = () => {
    Alert.alert(partnerName, "Chat actions", [
      {
        text: "Report chat",
        onPress: () => {
          setReportReason("spam");
          setReportDetails("");
          setReportOpen(true);
        },
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
              onPress: async () => {
                try {
                  await blockUser(partnerId);
                  Alert.alert("Blocked", "User blocked successfully.");
                } catch (e: unknown) {
                  const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
                  Alert.alert("Error", msg || "Failed to block user.");
                }
              },
            },
          ]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const load = useCallback(async () => {
    if (!partnerId || !user) return;
    setLoading(true);
    try {
      const data = await getConversationMessages(partnerId);
      setMessages(Array.isArray(data) ? data : []);
      await markConversationAsRead(partnerId);
      socket?.emit?.("mark_seen", { receiverId: partnerId });
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [partnerId, user, socket]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket || !user || !partnerId) return undefined;

    const onReceive = (message: Msg) => {
      const s = getId(message.sender);
      const r = getId(message.receiver);
      const me = user.id;
      if ((s === me && r === partnerId) || (s === partnerId && r === me)) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        if (s === partnerId) {
          socket.emit("mark_seen", { receiverId: partnerId });
        }
      }
    };

    const onEdited = (message: Msg) => {
      setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    };

    const onDeleted = (message: Msg) => {
      setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    };

    socket.on("receive_message", onReceive);
    socket.on("message_edited", onEdited);
    socket.on("message_deleted", onDeleted);
    const onMessagesRead = ({ receiverId }: { receiverId?: string }) => {
      if (String(receiverId || "") !== partnerId) return;
      setMessages((prev) =>
        prev.map((m) => {
          const mine = getId(m.sender) === user.id;
          const toPartner = getId(m.receiver) === partnerId;
          if (mine && toPartner) return { ...m, read: true };
          return m;
        })
      );
    };
    socket.on("messages_read", onMessagesRead);

    const onTyping = ({ userId: typerId }: { userId?: string }) => {
      if (String(typerId || "") === partnerId) setPartnerTyping(true);
    };
    const onStopTyping = ({ userId: typerId }: { userId?: string }) => {
      if (String(typerId || "") === partnerId) setPartnerTyping(false);
    };
    socket.on("user_typing", onTyping);
    socket.on("user_stop_typing", onStopTyping);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("message_edited", onEdited);
      socket.off("message_deleted", onDeleted);
      socket.off("messages_read", onMessagesRead);
      socket.off("user_typing", onTyping);
      socket.off("user_stop_typing", onStopTyping);
    };
  }, [socket, user, partnerId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || !socket || !partnerId) return;
    socket.emit("typing_stop", { receiverId: partnerId });
    socket.emit("send_message", { receiver: partnerId, content: trimmed });
    setText("");
  };

  const sendImage = async () => {
    if (sendingImage || !partnerId) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission", "Photo access is required to send images.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.length) return;
    const asset = res.assets[0];
    const mimeType = asset.mimeType || "image/jpeg";
    const ext = mimeType.includes("png") ? "png" : "jpg";
    const fd = new FormData();
    if (Platform.OS === "web") {
      const blob = await fetch(asset.uri).then((r) => r.blob());
      fd.append("image", blob, `chat.${ext}`);
    } else {
      fd.append("image", { uri: asset.uri, name: `chat.${ext}`, type: mimeType } as unknown as Blob);
    }
    fd.append("receiverId", partnerId);
    setSendingImage(true);
    try {
      await uploadChatImage(fd);
      // The socket event will update the message list automatically
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert("Error", msg || "Failed to send image.");
    } finally {
      setSendingImage(false);
    }
  };

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const formatTime = (msg: Msg) => {
    const d = msg.createdAt || msg.timestamp;
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      <Stack.Screen
        options={{
          title: partnerName,
          headerRight: () => (
            <Pressable onPress={openActions} className="px-2 py-1 active:opacity-70">
              <Ionicons name="ellipsis-vertical" size={18} color="#64748b" />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-[15px] font-outfit-m text-slate-500 dark:text-slate-400">Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <View className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/40 items-center justify-center mb-4">
              <Ionicons name="chatbubbles-outline" size={28} color="#6366f1" />
            </View>
            <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white text-center mb-1">Start the conversation</Text>
            <Text className="text-[14px] font-outfit text-slate-500 dark:text-slate-400 text-center">Say hello and make a deal!</Text>
          </View>
        ) : (
          <View className="flex-1">
            {partnerTyping ? (
              <View className="px-4 pt-2">
                <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400">Typing…</Text>
              </View>
            ) : null}
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m._id}
              contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item: m }) => {
                const mine = getId(m.sender) === user.id;
                return (
                  <View className={`mb-2.5 max-w-[80%] ${mine ? "self-end" : "self-start"}`}>
                    <View
                      className={`rounded-2xl px-4 py-2.5 ${
                        mine
                          ? "bg-primary-600 dark:bg-primary-500 rounded-br-sm"
                          : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-bl-sm"
                      }`}
                    >
                      {m.isDeleted ? (
                        <Text className={`text-[15px] font-outfit leading-relaxed italic ${mine ? "text-white/70" : "text-slate-400"}`}>
                          This message was deleted
                        </Text>
                      ) : m.image ? (
                        <Image source={{ uri: m.image }} style={{ width: 200, height: 200, borderRadius: 12 }} contentFit="cover" />
                      ) : (
                        <Text className={`text-[15px] font-outfit leading-relaxed ${mine ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
                          {m.content}
                        </Text>
                      )}
                    </View>
                    <Text
                      className={`text-[10px] font-outfit-m text-slate-400 dark:text-slate-500 mt-1 ${
                        mine ? "text-right mr-1" : "ml-1"
                      }`}
                    >
                      {formatTime(m)}
                      {mine && m.read ? " · Read" : ""}
                    </Text>
                  </View>
                );
              }}
            />
          </View>
        )}

        {/* Input Bar */}
        <View className="flex-row items-end gap-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 pb-3">
          {/* Image button */}
          <Pressable
            onPress={sendImage}
            disabled={sendingImage}
            className="h-11 w-11 rounded-full items-center justify-center bg-slate-100 dark:bg-slate-800 active:bg-slate-200"
          >
            <Ionicons name={sendingImage ? "hourglass-outline" : "image-outline"} size={20} color="#64748b" />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={(t) => {
              setText(t);
              if (!socket || !partnerId) return;
              socket.emit("typing_start", { receiverId: partnerId });
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => {
                socket.emit("typing_stop", { receiverId: partnerId });
              }, 1500);
            }}
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            multiline
            className="max-h-28 min-h-[44px] flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-[15px] font-outfit text-slate-900 dark:text-white"
          />
          <Pressable
            onPress={send}
            disabled={!text.trim()}
            className={`h-11 w-11 rounded-full items-center justify-center ${
              text.trim()
                ? "bg-primary-600 dark:bg-primary-500 active:bg-primary-700"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <Ionicons name="send" size={18} color={text.trim() ? "#fff" : "#94a3b8"} />
          </Pressable>
        </View>

        <Modal visible={reportOpen} transparent animationType="slide" onRequestClose={() => setReportOpen(false)}>
          <View className="flex-1 justify-end bg-black/60">
            <View className="rounded-t-3xl bg-white dark:bg-slate-950 p-6">
              <View className="items-center mb-4">
                <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              </View>
              <Text className="text-xl font-outfit-bl text-slate-900 dark:text-white mb-4">Report chat</Text>

              <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400 mb-1">Reason</Text>
              <TextInput
                value={reportReason}
                onChangeText={setReportReason}
                placeholder="e.g. spam, scam attempt, abusive language"
                placeholderTextColor="#94a3b8"
                className="mb-3 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white"
              />

              <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400 mb-1">Details (optional)</Text>
              <TextInput
                value={reportDetails}
                onChangeText={setReportDetails}
                placeholder="Extra details for moderators"
                placeholderTextColor="#94a3b8"
                multiline
                className="mb-4 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white"
              />

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Pressable
                    onPress={() => setReportOpen(false)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 items-center"
                    disabled={reportSubmitting}
                  >
                    <Text className="text-[15px] font-outfit-sb text-slate-700 dark:text-slate-200">Cancel</Text>
                  </Pressable>
                </View>
                <View className="flex-1">
                  <Pressable
                    onPress={async () => {
                      if (!reportReason.trim()) {
                        Alert.alert("Reason required", "Please enter a reason for reporting.");
                        return;
                      }
                      setReportSubmitting(true);
                      try {
                        await reportChatUser(partnerId, { reason: reportReason.trim(), details: reportDetails.trim() });
                        setReportOpen(false);
                        Alert.alert("Reported", "Chat report submitted successfully.");
                      } catch (e: unknown) {
                        const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
                        Alert.alert("Error", msg || "Failed to submit report.");
                      } finally {
                        setReportSubmitting(false);
                      }
                    }}
                    className="rounded-xl bg-red-600 px-4 py-3 items-center"
                    disabled={reportSubmitting}
                  >
                    <Text className="text-[15px] font-outfit-sb text-white">{reportSubmitting ? "Reporting..." : "Report"}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Screen>
  );
}
