import { useCallback, useEffect, useState, useMemo } from "react";
import { Link, Redirect } from "expo-router";
import { Alert, FlatList, Pressable, Text, View, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../components/ui/Screen";
import { PageHeader } from "../../components/ui/PageHeader";
import { Loading } from "../../components/Loading";
import { EmptyState } from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getConversations, pinConversation, unpinConversation } from "../../lib/api/chat";

type Conv = {
  _id: string;
  name?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isPinned?: boolean;
};

export default function ChatTabScreen() {
  const { user } = useAuth();
  const socket = useSocket();
  const [list, setList] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [online, setOnline] = useState<Record<string, boolean>>({});
  const [pinning, setPinning] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoadError(false);
    try {
      const data = await getConversations();
      setList(Array.isArray(data) ? data : []);
    } catch {
      setLoadError(true);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const togglePin = async (conv: Conv) => {
    if (pinning) return;
    setPinning(conv._id);
    try {
      if (conv.isPinned) {
        await unpinConversation(conv._id);
      } else {
        await pinConversation(conv._id);
      }
      await load();
    } catch {
      Alert.alert("Error", "Could not update pin. Please try again.");
    } finally {
      setPinning(null);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket || !user) return undefined;

    const onPresenceBatch = (data: Record<string, boolean>) => {
      if (!data || typeof data !== "object") return;
      setOnline((prev) => ({ ...prev, ...data }));
    };
    const onOnline = ({ userId: uid }: { userId?: string }) => {
      if (!uid) return;
      setOnline((prev) => ({ ...prev, [uid]: true }));
    };
    const onOffline = ({ userId: uid }: { userId?: string }) => {
      if (!uid) return;
      setOnline((prev) => ({ ...prev, [uid]: false }));
    };

    socket.on("presence_batch", onPresenceBatch);
    socket.on("user_online", onOnline);
    socket.on("user_offline", onOffline);

    const onReceiveMessage = () => load();
    socket.on("receive_message", onReceiveMessage);

    return () => {
      socket.off("presence_batch", onPresenceBatch);
      socket.off("user_online", onOnline);
      socket.off("user_offline", onOffline);
      socket.off("receive_message", onReceiveMessage);
    };
  }, [socket, user, load]);

  useEffect(() => {
    if (!socket || !user) return;
    const ids = list.map((c) => c._id).filter(Boolean);
    if (ids.length === 0) return;
    socket.emit("get_presence", ids);
  }, [socket, user, list]);

  const filteredList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;
    return list.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(query) ||
        (c.lastMessage || "").toLowerCase().includes(query)
    );
  }, [list, searchQuery]);

  const formatTime = (time?: string) => {
    if (!time) return "";
    const date = new Date(time);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (loading) {
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen>
        <EmptyState
          title="Could not load messages"
          message="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => {
            setLoading(true);
            load();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      <PageHeader title="Messages" />

      {/* Search Bar Section */}
      <View className="bg-white dark:bg-slate-900 px-5 pt-2 pb-4 shadow-sm">
        <View className="relative flex-row items-center">
          <View className="flex-1 relative">
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search people or messages..."
              placeholderTextColor="#94a3b8"
              className="rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 px-4 py-3 pr-10 text-[15px] font-outfit text-slate-900 dark:text-white"
            />
            <View className="absolute bottom-0 right-3 top-0 items-center justify-center">
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery("")} className="p-1">
                  <Ionicons name="close-circle" size={20} color="#94a3b8" />
                </Pressable>
              ) : (
                <Ionicons name="search-outline" size={20} color="#94a3b8" />
              )}
            </View>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredList}
        keyExtractor={(c) => c._id}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        refreshing={false}
        onRefresh={load}
        ListEmptyComponent={
          <View className="py-20 px-8 items-center">
            <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
              <Ionicons
                name={searchQuery ? "search-outline" : "chatbubble-ellipses-outline"}
                size={32}
                color="#64748b"
              />
            </View>
            <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white text-center">
              {searchQuery ? "No results found" : "No conversations yet"}
            </Text>
            <Text className="mt-2 text-[14px] font-outfit text-slate-500 dark:text-slate-400 text-center">
              {searchQuery
                ? `We couldn't find any matches for "${searchQuery}"`
                : "Start chatting with sellers to see your messages here."}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Link
            href={
              `/chat/${item._id}?name=${encodeURIComponent(item.name || "")}&pinned=${item.isPinned ? "1" : "0"}` as never
            }
            asChild
          >
            <Pressable
              onLongPress={() => togglePin(item)}
              className="flex-row items-center bg-white dark:bg-slate-900 px-5 py-4 mb-[1px] border-b border-slate-50 dark:border-slate-800/50 active:bg-slate-50 dark:active:bg-slate-800/40"
            >
              {/* Avatar with Online Status */}
              <View className="relative">
                <View className="h-14 w-14 rounded-full bg-primary-100 dark:bg-primary-900/60 items-center justify-center overflow-hidden">
                  <Text className="text-xl font-outfit-sb text-primary-700 dark:text-primary-300">
                    {(item.name || "U")[0].toUpperCase()}
                  </Text>
                </View>
                {online[item._id] ? (
                  <View className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm" />
                ) : null}
              </View>

              <View className="ml-4 flex-1">
                <View className="flex-row items-center justify-between mb-0.5">
                  <View className="flex-row items-center gap-1.5 flex-1">
                    <Text
                      className="text-[17px] font-outfit-sb text-slate-900 dark:text-white"
                      numberOfLines={1}
                    >
                      {item.name || "User"}
                    </Text>
                    {item.isPinned && (
                      <Ionicons name="pin" size={12} color="#6366f1" style={{ transform: [{ rotate: "45deg" }] }} />
                    )}
                  </View>
                  <Text className="text-[12px] font-outfit text-slate-400 dark:text-slate-500">
                    {formatTime(item.lastMessageTime)}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-[14px] font-outfit flex-1 mr-2 ${
                      item.unreadCount
                        ? "text-slate-900 dark:text-slate-100 font-outfit-m"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                    numberOfLines={1}
                  >
                    {item.lastMessage || "Start a conversation"}
                  </Text>
                  {!!item.unreadCount && (
                    <View className="h-5 min-w-[20px] rounded-full bg-primary-600 dark:bg-primary-500 items-center justify-center px-1.5">
                      <Text className="text-[10px] font-outfit-b text-white">
                        {item.unreadCount > 99 ? "99+" : item.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          </Link>
        )}
      />
    </Screen>
  );
}
