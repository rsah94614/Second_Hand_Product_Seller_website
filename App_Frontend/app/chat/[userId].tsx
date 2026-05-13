import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  InteractionManager,
  Platform,
  Appearance,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../components/ui/Screen";
import { KeyboardShiftView } from "../../components/ui/KeyboardShiftView";
import { useAuth } from "../../context/AuthContext";
import { useChatThread, getId } from "../../lib/hooks/useChatThread";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { MessageItem } from "../../components/chat/MessageItem";
import { ChatInputArea } from "../../components/chat/ChatInputArea";
import type { Msg } from "../../lib/types";

const QUICK_TEMPLATES = [
  "Is this still available?",
  "Where on campus can we meet?",
  "I am interested!",
  "Can we negotiate the price?",
];

export default function ChatThreadScreen() {
  const [ready, setReady] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const params = useLocalSearchParams<{ userId: string; name?: string; pinned?: string }>();

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
      <Screen className="bg-slate-50 dark:bg-slate-950">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#6366f1" />
        </View>
      </Screen>
    );
  }

  // Pass all context-sensitive data as props to keep the content stable
  return (
    <ChatThreadContent 
      params={params} 
      user={user} 
      isDark={Appearance.getColorScheme() === "dark"} 
    />
  );
}

function ChatThreadContent({ params, user, isDark }: { params: any; user: any; isDark: boolean }) {
  const { userId: partnerId, name: partnerNameFromQuery, pinned } = params;

  const {
    messages,
    loading,
    loadError,
    partnerTyping,
    isPinned,
    setIsPinned,
    editingMessageId,
    setEditingMessageId,
    sendMessage,
    sendImage,
    deleteMessage,
    togglePin,
    block,
    report,
    emitTyping,
    isConnected,
    isSendingImage,
  } = useChatThread(partnerId);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const listRef = useRef<FlatList>(null);
  const partnerName = partnerNameFromQuery || "Chat";

  useEffect(() => {
    if (pinned === "1") setIsPinned(true);
  }, [pinned, setIsPinned]);

  const openMessageActions = (message: Msg) => {
    if (getId(message.sender) !== user?.id || message.isDeleted || message._id.startsWith("temp-")) return;
    Alert.alert("Message actions", "Choose an action for this message.", [
      {
        text: "Edit",
        onPress: () => {
          setEditingMessageId(message._id);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteMessage(message._id);
        },
      },
      { text: "Cancel", style: "cancel" },
    ], { cancelable: true });
  };

  const formatTime = (message: Msg) => {
    const time = message.createdAt || message.timestamp || new Date().toISOString();
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950" safeAreaTop={false} safeAreaBottom={false}>
      <ChatHeader
        partnerName={partnerName}
        isPinned={isPinned}
        onTogglePin={togglePin}
        onBlock={block}
        onReport={() => setReportOpen(true)}
        isDark={isDark}
      />

      {!isConnected && (
        <View className="flex-row items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2">
          <Ionicons name="cloud-offline-outline" size={16} color="#92400e" />
          <Text className="text-[13px] font-outfit-m text-amber-800">
            Offline — messages will send when reconnected
          </Text>
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#6366f1" />
          <Text className="mt-2 text-[15px] font-outfit-m text-slate-500 dark:text-slate-400">Loading messages...</Text>
        </View>
      ) : loadError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-2 text-center text-[18px] font-outfit-sb text-slate-900 dark:text-white">
            Could not load messages
          </Text>
          <Text className="mb-4 text-center text-[14px] font-outfit text-slate-500 dark:text-slate-400">
            Check your connection and try again.
          </Text>
        </View>
      ) : (
        <KeyboardShiftView style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 12 }}
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "none"}
              keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                listRef.current?.scrollToEnd({ animated: true });
              }
            }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-10">
                <View className="h-20 w-20 rounded-full bg-primary-50 dark:bg-primary-900/30 items-center justify-center mb-4">
                  <Ionicons name="chatbubbles-outline" size={40} color="#6366f1" />
                </View>
                <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white">Start the conversation</Text>
                <Text className="text-[14px] font-outfit text-slate-500 dark:text-slate-400 text-center px-10 mt-1">
                  Send a message or use a template below to get started.
                </Text>

                <View className="flex-row flex-wrap justify-center gap-2 mt-8 px-4">
                  {QUICK_TEMPLATES.map((tmpl) => (
                    <Pressable
                      key={tmpl}
                      onPress={() => sendMessage(tmpl)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl shadow-sm active:bg-slate-50"
                    >
                      <Text className="text-[13px] font-outfit-m text-primary-600 dark:text-primary-400">{tmpl}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            }
            renderItem={({ item, index }) => {
              const isMine = getId(item.sender) === user?.id;
              const prevMsg = messages[index - 1];
              const showDate = !prevMsg || new Date(getMessageTime(prevMsg)).toDateString() !== new Date(getMessageTime(item)).toDateString();

              return (
                <MessageItem
                  message={item}
                  isMine={isMine}
                  showDate={showDate}
                  formattedTime={formatTime(item)}
                  onLongPress={openMessageActions}
                />
              );
            }}
          />

          {partnerTyping && (
            <View className="px-6 py-2 flex-row items-center gap-2">
              <View className="flex-row gap-1 bg-slate-200 dark:bg-slate-800 px-3 py-2 rounded-2xl rounded-bl-none">
                <View className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
                <View className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
                <View className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
              </View>
              <Text className="text-[11px] font-outfit-m text-slate-400 dark:text-slate-500">
                {partnerName} is typing...
              </Text>
            </View>
          )}

          <ChatInputArea
            initialText={editingMessageId ? (messages.find(m => m._id === editingMessageId)?.content || "") : ""}
            onSend={sendMessage}
            onSendImage={sendImage}
            onTyping={emitTyping}
            editingMessageId={editingMessageId}
            onCancelEdit={() => {
              setEditingMessageId(null);
            }}
            sendingImage={isSendingImage}
            isConnected={isConnected}
          />
          </View>
        </KeyboardShiftView>
      )}

      {/* Report Modal */}
      <Modal visible={reportOpen} transparent animationType="slide" onRequestClose={() => setReportOpen(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <KeyboardShiftView
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <View className="bg-white dark:bg-slate-900 rounded-t-[32px] p-6 pb-10">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-[20px] font-outfit-b text-slate-900 dark:text-white">Report User</Text>
                <Pressable onPress={() => setReportOpen(false)} className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Ionicons name="close" size={20} color="#64748b" />
                </Pressable>
              </View>

              <Text className="text-[14px] font-outfit-sb text-slate-700 dark:text-slate-300 mb-3">Reason for reporting</Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {["spam", "harassment", "fraud", "other"].map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setReportReason(r)}
                    className={`px-4 py-2 rounded-xl border ${reportReason === r
                      ? "bg-primary-50 border-primary-500 dark:bg-primary-900/30"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                      }`}
                  >
                    <Text className={`text-[13px] font-outfit-m capitalize ${reportReason === r ? "text-primary-700 dark:text-primary-400" : "text-slate-600 dark:text-slate-400"}`}>
                      {r}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-[14px] font-outfit-sb text-slate-700 dark:text-slate-300 mb-3">Additional Details</Text>
              <TextInput
                multiline
                numberOfLines={4}
                value={reportDetails}
                onChangeText={setReportDetails}
                placeholder="Please provide more information..."
                placeholderTextColor="#94a3b8"
                className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-[15px] font-outfit text-slate-900 dark:text-white mb-8 min-h-[100px] border border-slate-100 dark:border-slate-800"
              />

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Pressable
                    onPress={() => setReportOpen(false)}
                    className="h-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 active:bg-slate-200"
                  >
                    <Text className="text-[15px] font-outfit-sb text-slate-700 dark:text-slate-200">Cancel</Text>
                  </Pressable>
                </View>
                <View className="flex-1">
                  <Pressable
                    disabled={reportSubmitting}
                    onPress={async () => {
                      setReportSubmitting(true);
                      await report(reportReason, reportDetails);
                      setReportSubmitting(false);
                      setReportOpen(false);
                    }}
                    className="h-12 items-center justify-center rounded-2xl bg-red-600 active:bg-red-700"
                  >
                    {reportSubmitting ? <ActivityIndicator color="#fff" /> : <Text className="text-[15px] font-outfit-sb text-white">Submit Report</Text>}
                  </Pressable>
                </View>
              </View>
            </View>
          </KeyboardShiftView>
        </View>
      </Modal>
    </Screen>
  );
}

const getMessageTime = (message: Msg) => message.createdAt || message.timestamp || new Date().toISOString();
