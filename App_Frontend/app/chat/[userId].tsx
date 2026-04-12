import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getConversationMessages, markConversationAsRead } from "../../lib/api/chat";
import { Ionicons } from "@expo/vector-icons";

type Msg = {
  _id: string;
  content: string;
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
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

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
      .find(Boolean) || "Chat";

  const load = useCallback(async () => {
    if (!partnerId || !user) return;
    setLoading(true);
    try {
      const data = await getConversationMessages(partnerId);
      setMessages(Array.isArray(data) ? data : []);
      await markConversationAsRead(partnerId);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [partnerId, user]);

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

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("message_edited", onEdited);
      socket.off("message_deleted", onDeleted);
    };
  }, [socket, user, partnerId]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || !socket || !partnerId) return;
    socket.emit("send_message", { receiver: partnerId, content: trimmed });
    setText("");
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
      <Stack.Screen options={{ title: partnerName }} />
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
                    <Text
                      className={`text-[15px] font-outfit leading-relaxed ${
                        mine ? "text-white" : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {m.isDeleted ? "This message was deleted" : m.content}
                    </Text>
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
        )}

        {/* Input Bar */}
        <View className="flex-row items-end gap-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 pb-3">
          <TextInput
            value={text}
            onChangeText={setText}
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
      </KeyboardAvoidingView>
    </Screen>
  );
}
