import { useCallback, useEffect, useState } from "react";
import { Link, Redirect } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { EmptyState } from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { getConversations } from "../../lib/api/chat";

type Conv = {
  _id: string;
  name?: string;
  lastMessage?: string;
  unreadCount?: number;
};

export default function ChatTabScreen() {
  const { user } = useAuth();
  const socket = useSocket();
  const [list, setList] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getConversations();
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

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

    return () => {
      socket.off("presence_batch", onPresenceBatch);
      socket.off("user_online", onOnline);
      socket.off("user_offline", onOffline);
    };
  }, [socket, user]);

  useEffect(() => {
    if (!socket || !user) return;
    const ids = list.map((c) => c._id).filter(Boolean);
    if (ids.length === 0) return;
    socket.emit("get_presence", ids);
  }, [socket, user, list]);

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

  return (
    <Screen className="bg-white dark:bg-slate-900">
      <FlatList
        data={list}
        keyExtractor={(c) => c._id}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        refreshing={false}
        onRefresh={load}
        ListEmptyComponent={
          <View className="py-16">
             <EmptyState
               title="No conversations yet"
               message="Start chatting from a product page when you want to contact a seller."
             />
          </View>
        }
        renderItem={({ item }) => (
          <Link href={`/chat/${item._id}` as never} asChild>
            <Pressable className="flex-row items-center bg-white dark:bg-slate-900 px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 active:bg-slate-50 dark:active:bg-slate-800/50">
              <View className="h-14 w-14 rounded-full bg-primary-100 dark:bg-primary-900/60 items-center justify-center">
                 <Text className="text-xl font-outfit-sb text-primary-700 dark:text-primary-400">
                    {(item.name || "U")[0].toUpperCase()}
                 </Text>
                 {online[item._id] ? (
                   <View className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                 ) : null}
              </View>
              
              <View className="ml-4 flex-1 justify-center">
                <Text className="text-[17px] font-outfit-sb text-slate-900 dark:text-white mb-0.5">
                  {item.name || "User"}
                </Text>
                {item.lastMessage ? (
                  <Text className={`text-[14px] font-outfit ${item.unreadCount ? 'text-slate-900 dark:text-slate-100 font-outfit-m' : 'text-slate-500 dark:text-slate-400'}`} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                ) : null}
              </View>
              
              {(item.unreadCount || 0) > 0 ? (
                <View className="ml-3 h-6 min-w-[24px] rounded-full bg-primary-600 dark:bg-primary-500 items-center justify-center px-1.5 shadow-sm shadow-primary-500/30">
                  <Text className="text-[11px] font-outfit-b text-white">{item.unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </Link>
        )}
      />
    </Screen>
  );
}
