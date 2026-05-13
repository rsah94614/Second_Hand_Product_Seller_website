import { useCallback, useEffect, useState, useRef } from "react";
import { Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useSocket, useSocketStatus } from "../../context/SocketContext";
import {
  getConversationMessages,
  markConversationAsRead,
  pinConversation,
  unpinConversation,
  uploadChatImage,
  reportChatUser,
} from "../api/chat";
import { blockUser as apiBlockUser } from "../api/users";
import { parseApiError, formatErrorForDisplay } from "../utils/errorHandler";
import type { Msg } from "../types";
import { useToast } from "../../components/ui/AppToast";

// ── Helpers ───────────────────────────────────────────────────────────────────
const generateIdempotencyKey = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
};

export const getId = (value: unknown) =>
  typeof value === "object" && value && "_id" in value
    ? String((value as { _id: string })._id)
    : String(value || "");

const offlineQueue: {
  receiver: string;
  content: string;
  idempotencyKey: string;
  optimisticId: string;
  queuedAt: number;
}[] = [];

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useChatThread(partnerId: string) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const socket = useSocket();
  const isConnected = useSocketStatus();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isSendingImage, setIsSendingImage] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // ── Load messages ───────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!partnerId || !user) return;
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getConversationMessages(partnerId);
      const fetchedMessages = Array.isArray(data) ? data : [];
      setMessages(fetchedMessages);
      
      if (socket) {
        fetchedMessages.forEach((msg: Msg) => {
          const senderId = getId(msg.sender);
          if (senderId === partnerId && !msg.read) {
            socket.emit('message_read', { messageId: msg._id }, (result: any) => {
              if (result?.success) {
                setMessages((prev) =>
                  prev.map((item) =>
                    item._id === msg._id ? { ...item, read: true } : item
                  )
                );
              }
            });
          }
        });
      }
      
      await markConversationAsRead(partnerId);
      socket?.emit?.("mark_seen", { receiverId: partnerId });
    } catch {
      setLoadError(true);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [partnerId, socket, user]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Socket listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !user || !partnerId) return undefined;

    const onReceive = (message: Msg) => {
      const senderId = getId(message.sender);
      const receiverId = getId(message.receiver);
      const me = user?.id;

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

        if (receiverId === me && senderId === partnerId) {
          socket.emit('message_delivered', { messageId: message._id }, (result: any) => {
            if (result?.success) {
              setMessages((prev) =>
                prev.map((item) =>
                  item._id === message._id ? { ...item, delivered: true } : item
                )
              );
            }
          });
        }
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
          const mine = getId(item.sender) === user?.id;
          const toPartner = getId(item.receiver) === partnerId;
          return mine && toPartner ? { ...item, read: true } : item;
        })
      );
    };

    const onTyping = ({ userId: typerId }: { userId?: string }) => {
      if (String(typerId || "") === partnerId) {
        setPartnerTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 3000);
      }
    };

    socket.on("receive_message", onReceive);
    socket.on("message_edited", onEdited);
    socket.on("message_deleted", onDeleted);
    socket.on("messages_read", onMessagesRead);
    socket.on("typing", onTyping);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("message_edited", onEdited);
      socket.off("message_deleted", onDeleted);
      socket.off("messages_read", onMessagesRead);
      socket.off("typing", onTyping);
    };
  }, [socket, user, partnerId]);

  // ── Offline Queue Processor ──────────────────────────────────────────────────
  useEffect(() => {
    if (isConnected && socket && offlineQueue.length > 0) {
      const items = [...offlineQueue];
      offlineQueue.length = 0;
      items.forEach((msg) => {
        socket.emit("send_message", {
          receiverId: msg.receiver,
          content: msg.content,
          idempotencyKey: msg.idempotencyKey,
        });
      });
    }
  }, [isConnected, socket]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const sendMessage = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed || !partnerId || !user) return;

    if (editingMessageId) {
      socket?.emit("edit_message", { messageId: editingMessageId, newContent: trimmed });
      setEditingMessageId(null);
      return;
    }

    const idempotencyKey = generateIdempotencyKey();
    const optimisticMessage: Msg = {
      _id: `temp-${idempotencyKey}`,
      content: trimmed,
      sender: user?.id,
      receiver: partnerId,
      timestamp: new Date().toISOString(),
      read: false,
      delivered: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    if (!isConnected || !socket) {
      offlineQueue.push({
        receiver: partnerId,
        content: trimmed,
        idempotencyKey,
        optimisticId: optimisticMessage._id,
        queuedAt: Date.now(),
      });
    } else {
      socket.emit("send_message", {
        receiverId: partnerId,
        content: trimmed,
        idempotencyKey,
      });
    }
  }, [editingMessageId, partnerId, user, isConnected, socket]);

  const sendImage = useCallback(async (uri: string, mimeType: string) => {
    if (!partnerId) return;
    try {
      setIsSendingImage(true);
      const fd = new FormData();
      const filename = uri.split("/").pop() || "upload.jpg";
      fd.append("image", { uri, name: filename, type: mimeType } as any);
      fd.append("receiverId", partnerId);

      const res = await uploadChatImage(fd);
      // The backend already creates the message and emits 'receive_message' via socket
      // No need to call sendMessage here as it would create a duplicate text message.
    } catch (e: any) {
      console.error("[sendImage] Error:", e);
      showToast("Could not upload image. Please try again.");
    } finally {
      setIsSendingImage(false);
    }
  }, [partnerId, sendMessage, showToast]);

  const togglePin = useCallback(async () => {
    if (!partnerId || pinBusy) return;
    setPinBusy(true);
    try {
      if (isPinned) {
        await unpinConversation(partnerId);
      } else {
        await pinConversation(partnerId);
      }
      setIsPinned((prev) => !prev);
      showToast(isPinned ? "Conversation unpinned." : "Conversation pinned.");
    } catch (error: any) {
      const parsed = parseApiError(error, "Failed to update pin.");
      Alert.alert("Error", formatErrorForDisplay(parsed), [{ text: "OK" }], { cancelable: true });
    } finally {
      setPinBusy(false);
    }
  }, [partnerId, pinBusy, isPinned, showToast]);

  const block = useCallback(async () => {
    try {
      await apiBlockUser(partnerId);
      showToast("User blocked successfully.");
    } catch (error: any) {
      const parsed = parseApiError(error, "Failed to block user.");
      Alert.alert("Error", formatErrorForDisplay(parsed), [{ text: "OK" }], { cancelable: true });
    }
  }, [partnerId, showToast]);

  const report = useCallback(async (reason: string, details: string) => {
    try {
      await reportChatUser(partnerId, { reason, details });
      showToast("User reported successfully.");
    } catch (error: any) {
      const parsed = parseApiError(error, "Failed to report user.");
      Alert.alert("Error", formatErrorForDisplay(parsed), [{ text: "OK" }], { cancelable: true });
    }
  }, [partnerId, showToast]);

  const emitTyping = useCallback(() => {
    if (socket && isConnected && partnerId) {
      socket.emit("typing", { receiverId: partnerId });
    }
  }, [socket, isConnected, partnerId]);

  const deleteMessage = useCallback((messageId: string) => {
    if (socket && isConnected) {
      socket.emit("delete_message", { messageId });
    }
  }, [socket, isConnected]);

  return {
    messages,
    loading,
    loadError,
    partnerTyping,
    pinBusy,
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
  };
}
