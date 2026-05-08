import { router, useGlobalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  InteractionManager
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { useAuth } from "../../context/AuthContext";
import { useSocket, useSocketStatus } from "../../context/SocketContext";
import {
  getConversationMessages,
  markConversationAsRead,
  pinConversation,
  reportChatUser,
  searchMessages,
  unpinConversation,
  uploadChatImage,
} from "../../lib/api/chat";
import { blockUser } from "../../lib/api/users";
import { formatErrorForDisplay, parseApiError } from "../../lib/utils/errorHandler";

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
  isEdited?: boolean;
};

const QUICK_TEMPLATES = [
  "Is this still available?",
  "Where on campus can we meet?",
  "I am interested!",
  "Can we negotiate the price?",
];

const getId = (value: unknown) =>
  typeof value === "object" && value && "_id" in value
    ? String((value as { _id: string })._id)
    : String(value || "");

const getName = (value: unknown) =>
  typeof value === "object" && value && "name" in value
    ? String((value as { name?: string }).name || "")
    : "";

const getMessageTime = (message: Msg) => message.createdAt || message.timestamp || new Date().toISOString();

export default function ChatThreadScreen() {
  const [ready, setReady] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setReady(true);
    });
    return () => task.cancel();
  }, []);

  useEffect(() => {
    if (ready && !authLoading && !user) {
      router.replace("/(auth)/login");
    }
  }, [ready, authLoading, user]);

  if (!ready || authLoading || !user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#020617" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return <ChatThreadContent />;
}

function ChatThreadContent() {
  const { userId, name, pinned } = useGlobalSearchParams<{ userId: string; name?: string; pinned?: string }>();
  const { user } = useAuth();
  const socket = useSocket();
  const isConnected = useSocketStatus();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [messageSearch, setMessageSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Msg[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [isPinned, setIsPinned] = useState(pinned === "1");
  const listRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const partnerId = String(userId || "");
  const partnerName = useMemo(
    () =>
      messages
        .map((message) => {
          const senderId = getId(message.sender);
          const receiverId = getId(message.receiver);
          if (senderId === partnerId) return getName(message.sender);
          if (receiverId === partnerId) return getName(message.receiver);
          return "";
        })
        .find(Boolean) || (name ? String(name) : "Chat"),
    [messages, name, partnerId]
  );

  const load = useCallback(async () => {
    if (!partnerId || !user || !isConnected) return;
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getConversationMessages(partnerId);
      setMessages(Array.isArray(data) ? data : []);
      await markConversationAsRead(partnerId);
      socket?.emit?.("mark_seen", { receiverId: partnerId });
    } catch {
      setLoadError(true);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [isConnected, partnerId, socket, user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket || !user || !partnerId) return undefined;

    const onReceive = (message: Msg) => {
      const senderId = getId(message.sender);
      const receiverId = getId(message.receiver);
      const me = user.id;

      if ((senderId === me && receiverId === partnerId) || (senderId === partnerId && receiverId === me)) {
        setMessages((prev) => {
          if (senderId === me) {
            const withoutTemp = prev.filter(
              (item) => !(item._id.startsWith("temp-") && item.content === message.content && getId(item.receiver) === partnerId)
            );
            if (withoutTemp.some((item) => item._id === message._id)) return withoutTemp;
            return [...withoutTemp, message];
          }

          if (prev.some((item) => item._id === message._id)) return prev;
          return [...prev, message];
        });

        if (senderId === partnerId) {
          socket.emit("mark_seen", { receiverId: partnerId });
        }
      }
    };

    const onEdited = (message: Msg) => {
      setMessages((prev) => prev.map((item) => (item._id === message._id ? message : item)));
    };

    const onDeleted = (message: Msg) => {
      setMessages((prev) => prev.map((item) => (item._id === message._id ? message : item)));
    };

    const onMessagesRead = ({ receiverId }: { receiverId?: string }) => {
      if (String(receiverId || "") !== partnerId) return;
      setMessages((prev) =>
        prev.map((item) => {
          const mine = getId(item.sender) === user.id;
          const toPartner = getId(item.receiver) === partnerId;
          return mine && toPartner ? { ...item, read: true } : item;
        })
      );
    };

    const onTyping = ({ userId: typerId }: { userId?: string }) => {
      if (String(typerId || "") === partnerId) setPartnerTyping(true);
    };

    const onStopTyping = ({ userId: typerId }: { userId?: string }) => {
      if (String(typerId || "") === partnerId) setPartnerTyping(false);
    };

    const onError = (err: { message?: string; code?: string }) => {
      if (err.code === "PROFILE_INCOMPLETE") {
        Alert.alert("Profile Incomplete", err.message || "Please complete your profile to start new chats.", [
          { text: "Cancel", style: "cancel" },
          { text: "Go to Profile", onPress: () => router.push("/(tabs)/profile") },
        ]);
        return;
      }

      Alert.alert("Chat Error", err.message || "Failed to complete chat action.");
    };

    socket.on("receive_message", onReceive);
    socket.on("message_edited", onEdited);
    socket.on("message_deleted", onDeleted);
    socket.on("messages_read", onMessagesRead);
    socket.on("user_typing", onTyping);
    socket.on("user_stop_typing", onStopTyping);
    socket.on("error", onError);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("message_edited", onEdited);
      socket.off("message_deleted", onDeleted);
      socket.off("messages_read", onMessagesRead);
      socket.off("user_typing", onTyping);
      socket.off("user_stop_typing", onStopTyping);
      socket.off("error", onError);
    };
  }, [partnerId, socket, user]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const stopTyping = () => {
    if (!socket || !partnerId) return;
    socket.emit("typing_stop", { receiverId: partnerId });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || !socket || !partnerId || !user) return;

    stopTyping();

    if (editingMessageId) {
      socket.emit("edit_message", { messageId: editingMessageId, newContent: trimmed });
      setEditingMessageId(null);
      setText("");
      return;
    }

    const optimisticMessage: Msg = {
      _id: `temp-${Date.now()}`,
      content: trimmed,
      sender: user.id,
      receiver: partnerId,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setText("");
    socket.emit("send_message", { receiver: partnerId, content: trimmed });
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
      const blob = await fetch(asset.uri).then((response) => response.blob());
      fd.append("image", blob, `chat.${ext}`);
    } else {
      fd.append("image", { uri: asset.uri, name: `chat.${ext}`, type: mimeType } as unknown as Blob);
    }

    fd.append("receiverId", partnerId);
    setSendingImage(true);
    try {
      await uploadChatImage(fd);
    } catch (error: any) {
      const parsed = parseApiError(error, "Failed to send image.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    } finally {
      setSendingImage(false);
    }
  };

  const togglePin = async () => {
    if (!partnerId || pinBusy) return;
    setPinBusy(true);
    try {
      if (isPinned) {
        await unpinConversation(partnerId);
      } else {
        await pinConversation(partnerId);
      }
      setIsPinned((prev) => !prev);
    } catch (error: any) {
      const parsed = parseApiError(error, "Failed to update pin.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    } finally {
      setPinBusy(false);
    }
  };

  const openActions = () => {
    Alert.alert(partnerName, "Chat actions", [
      {
        text: isPinned ? "Unpin conversation" : "Pin conversation",
        onPress: () => {
          void togglePin();
        },
      },
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
                } catch (error: any) {
                  const parsed = parseApiError(error, "Failed to block user.");
                  Alert.alert("Error", formatErrorForDisplay(parsed));
                }
              },
            },
          ]);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openMessageActions = (message: Msg) => {
    if (!socket || getId(message.sender) !== user?.id || message.isDeleted || message._id.startsWith("temp-")) return;

    Alert.alert("Message actions", "Choose an action for this message.", [
      {
        text: "Edit",
        onPress: () => {
          setEditingMessageId(message._id);
          setText(message.content || "");
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => socket.emit("delete_message", { messageId: message._id }),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSearchChange = async (value: string) => {
    setMessageSearch(value);

    if (value.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const data = await searchMessages(value.trim(), partnerId);
      const results = Array.isArray(data?.messages) ? data.messages : Array.isArray(data) ? data : [];
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const formatTime = (message: Msg) => {
    const date = new Date(getMessageTime(message));
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 80}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-[15px] font-outfit-m text-slate-500 dark:text-slate-400">Loading messages...</Text>
          </View>
        ) : loadError ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="mb-2 text-center text-[18px] font-outfit-sb text-slate-900 dark:text-white">
              Could not load messages
            </Text>
            <Text className="mb-4 text-center text-[14px] font-outfit text-slate-500 dark:text-slate-400">
              Check your connection and try again.
            </Text>
            <Pressable onPress={load} className="rounded-2xl bg-primary-600 px-6 py-2.5 active:bg-primary-700">
              <Text className="font-outfit-sb text-white">Retry</Text>
            </Pressable>
          </View>
        ) : messages.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40">
              <Ionicons name="chatbubbles-outline" size={28} color="#6366f1" />
            </View>
            <Text className="mb-1 text-center text-[18px] font-outfit-sb text-slate-900 dark:text-white">
              Start the conversation
            </Text>
            <Text className="text-center text-[14px] font-outfit text-slate-500 dark:text-slate-400">
              Say hello and make a deal!
            </Text>
          </View>
        ) : (
          <View className="flex-1">
            <View className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <View className="relative">
                <TextInput
                  value={messageSearch}
                  onChangeText={(value) => {
                    void handleSearchChange(value);
                  }}
                  placeholder="Search messages..."
                  placeholderTextColor="#94a3b8"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-[14px] font-outfit text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <View className="absolute bottom-0 right-3 top-0 items-center justify-center">
                  <Ionicons name={searching ? "hourglass-outline" : "search-outline"} size={16} color="#94a3b8" />
                </View>
              </View>
              {searchResults !== null ? (
                <View className="mt-2 overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
                  {searchResults.length === 0 ? (
                    <Text className="px-4 py-3 text-[12px] font-outfit text-slate-500 dark:text-slate-400">
                      No messages found
                    </Text>
                  ) : (
                    searchResults.slice(0, 4).map((message) => (
                      <View key={message._id} className="border-b border-slate-100 px-4 py-2.5 last:border-b-0 dark:border-slate-800">
                        <Text className="text-[11px] font-outfit-m text-slate-500 dark:text-slate-400">
                          {new Date(getMessageTime(message)).toLocaleDateString()}
                        </Text>
                        <Text className="mt-0.5 text-[13px] font-outfit text-slate-800 dark:text-slate-100">
                          {message.content || "Image message"}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              ) : null}
            </View>

            {partnerTyping ? (
              <View className="px-4 pt-2">
                <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400">Typing...</Text>
              </View>
            ) : null}

            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(message) => message._id}
              contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item: message }) => {
                const mine = getId(message.sender) === user?.id;
                return (
                  <Pressable
                    onLongPress={() => openMessageActions(message)}
                    className={`mb-2.5 max-w-[80%] ${mine ? "self-end" : "self-start"}`}
                  >
                    <View
                      className={`rounded-2xl px-4 py-2.5 ${
                        mine
                          ? "rounded-br-sm bg-primary-600 dark:bg-primary-500"
                          : "rounded-bl-sm border border-slate-100 bg-white dark:border-slate-700 dark:bg-slate-800"
                      }`}
                    >
                      {message.isDeleted ? (
                        <Text className={`text-[15px] font-outfit italic leading-relaxed ${mine ? "text-white/70" : "text-slate-400"}`}>
                          This message was deleted
                        </Text>
                      ) : message.image ? (
                        <View>
                          <Image source={{ uri: message.image }} style={{ width: 200, height: 200, borderRadius: 12 }} contentFit="cover" />
                          {message.content ? (
                            <Text className={`mt-2 text-[15px] font-outfit leading-relaxed ${mine ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
                              {message.content}
                            </Text>
                          ) : null}
                        </View>
                      ) : (
                        <Text className={`text-[15px] font-outfit leading-relaxed ${mine ? "text-white" : "text-slate-900 dark:text-slate-100"}`}>
                          {message.content}
                        </Text>
                      )}
                    </View>
                    <Text className={`mt-1 text-[10px] font-outfit-m text-slate-400 dark:text-slate-500 ${mine ? "mr-1 text-right" : "ml-1"}`}>
                      {message.isEdited && !message.isDeleted ? "Edited · " : ""}
                      {formatTime(message)}
                      {mine && message.read ? " · Read" : ""}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        )}

        <View className="border-t border-slate-200 bg-white px-3 py-2 pb-3 dark:border-slate-800 dark:bg-slate-900">
          {editingMessageId ? (
            <View className="mb-2 flex-row items-center justify-between rounded-2xl border border-primary-100 bg-primary-50 px-4 py-2 dark:border-primary-900/30 dark:bg-primary-950/30">
              <Text className="text-[12px] font-outfit-m text-primary-700 dark:text-primary-300">Editing message</Text>
              <Pressable
                onPress={() => {
                  setEditingMessageId(null);
                  setText("");
                }}
                className="rounded-full p-1 active:bg-primary-100 dark:active:bg-primary-900/40"
              >
                <Ionicons name="close" size={16} color="#6366f1" />
              </Pressable>
            </View>
          ) : null}

          {messages.length < 5 ? (
            <View className="mb-2 flex-row gap-2">
              <FlatList
                horizontal
                data={QUICK_TEMPLATES}
                keyExtractor={(item) => item}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => setText(item)}
                    className="mr-2 rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 dark:border-primary-900/30 dark:bg-primary-950/30"
                  >
                    <Text className="text-[12px] font-outfit-m text-primary-700 dark:text-primary-300">{item}</Text>
                  </Pressable>
                )}
              />
            </View>
          ) : null}

          <View className="flex-row items-end gap-2">
            <Pressable
              onPress={sendImage}
              disabled={sendingImage}
              className="h-11 w-11 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200 dark:bg-slate-800"
            >
              <Ionicons name={sendingImage ? "hourglass-outline" : "image-outline"} size={20} color="#64748b" />
            </Pressable>

            <TextInput
              value={text}
              onChangeText={(value) => {
                setText(value);
                if (!socket || !partnerId || editingMessageId) return;
                socket.emit("typing_start", { receiverId: partnerId });
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  socket.emit("typing_stop", { receiverId: partnerId });
                }, 1500);
              }}
              placeholder={editingMessageId ? "Edit your message..." : "Type a message..."}
              placeholderTextColor="#94a3b8"
              multiline
              className="max-h-28 min-h-[44px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[15px] font-outfit text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />

            <Pressable
              onPress={send}
              disabled={!text.trim()}
              className={`h-11 w-11 items-center justify-center rounded-full ${
                text.trim() ? "bg-primary-600 active:bg-primary-700 dark:bg-primary-500" : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <Ionicons name={editingMessageId ? "checkmark" : "send"} size={18} color={text.trim() ? "#fff" : "#94a3b8"} />
            </Pressable>
          </View>
        </View>

        <Modal visible={reportOpen} transparent animationType="slide" onRequestClose={() => setReportOpen(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
            <View className="flex-1 justify-end bg-black/60">
              <View className="rounded-t-3xl bg-white p-6 dark:bg-slate-950">
                <View className="mb-4 items-center">
                  <View className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
                </View>
                <Text className="mb-4 text-xl font-outfit-bl text-slate-900 dark:text-white">Report chat</Text>

                <Text className="mb-1 text-[12px] font-outfit-m text-slate-500 dark:text-slate-400">Reason</Text>
                <TextInput
                  value={reportReason}
                  onChangeText={setReportReason}
                  placeholder="e.g. spam, scam attempt, abusive language"
                  placeholderTextColor="#94a3b8"
                  className="mb-3 rounded-2xl border border-slate-200 px-4 py-3 text-[15px] font-outfit text-slate-900 dark:border-slate-800 dark:text-white"
                />

                <Text className="mb-1 text-[12px] font-outfit-m text-slate-500 dark:text-slate-400">Details (optional)</Text>
                <TextInput
                  value={reportDetails}
                  onChangeText={setReportDetails}
                  placeholder="Extra details for moderators"
                  placeholderTextColor="#94a3b8"
                  multiline
                  className="mb-4 rounded-2xl border border-slate-200 px-4 py-3 text-[15px] font-outfit text-slate-900 dark:border-slate-800 dark:text-white"
                />

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Pressable
                      onPress={() => setReportOpen(false)}
                      className="items-center rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700"
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
                          await reportChatUser(partnerId, {
                            reason: reportReason.trim(),
                            details: reportDetails.trim(),
                          });
                          setReportOpen(false);
                          Alert.alert("Reported", "Chat report submitted successfully.");
                        } catch (error: any) {
                          const parsed = parseApiError(error, "Failed to submit report.");
                          Alert.alert("Error", formatErrorForDisplay(parsed));
                        } finally {
                          setReportSubmitting(false);
                        }
                      }}
                      className="items-center rounded-xl bg-red-600 px-4 py-3"
                      disabled={reportSubmitting}
                    >
                      <Text className="text-[15px] font-outfit-sb text-white">
                        {reportSubmitting ? "Reporting..." : "Report"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </KeyboardAvoidingView>
    </Screen>
  );
}
