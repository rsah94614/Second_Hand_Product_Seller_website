import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Send, MessageSquare, ArrowLeft, Edit2, Trash2, Check, CheckCheck, X, Ban, ShieldAlert, Pin, PinOff, Search, Image, WifiOff } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useSocket, useSocketStatus } from '../../../context/SocketContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import Header from '../../../components/Header';
import { getConversationMessages, getConversations, reportChatUser, pinConversation, unpinConversation, searchMessages, uploadChatImage, markConversationAsRead } from '../api/chatApi';
import { blockUser } from '../../users/api/userApi';

// ── Offline message queue (localStorage-backed) ──────────────────────────────
const OFFLINE_QUEUE_KEY = 'chat_offline_queue';

const loadOfflineQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveOfflineQueue = (queue) => {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch { /* storage full — ignore */ }
};

const generateIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const QUICK_TEMPLATES = [
  'Is this still available?',
  'Where on campus can we meet?',
  'I am interested!',
  'Can we negotiate the price?'
];

// ────────── helpers ──────────
const getSenderId = (msg) => (typeof msg.sender === 'object' ? msg.sender._id : msg.sender);
const getReceiverId = (msg) => (typeof msg.receiver === 'object' ? msg.receiver._id : msg.receiver);

const formatDateLabel = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

// ────────── component ──────────
function ChatPage() {
  const { user } = useAuth();
  const socket = useSocket();
  const isConnected = useSocketStatus();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [messageSearch, setMessageSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const scrollRef = useRef();
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef();
  const blockMutation = useMutation({
    mutationFn: (userId) => blockUser(userId),
    onSuccess: () => {
      toast.success('User blocked successfully');
      setCurrentChat(null);
      fetchConversations();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to block user');
    }
  });

  const pinMutation = useMutation({
    mutationFn: ({ userId, isPinned }) => isPinned ? unpinConversation(userId) : pinConversation(userId),
    onSuccess: (_, { isPinned }) => {
      toast.success(isPinned ? 'Conversation unpinned' : 'Conversation pinned');
      fetchConversations();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update pin'),
  });

  const imageMutation = useMutation({
    mutationFn: (formData) => uploadChatImage(formData),
    onSuccess: () => toast.success('Image sent'),
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to send image'),
  });

  const reportMutation = useMutation({
    mutationFn: ({ userId, payload }) => reportChatUser(userId, payload),
    onSuccess: () => {
      toast.success('Chat reported to moderators');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit chat report');
    }
  });

  useEffect(() => {
    if (!socket) return undefined;

    const handleSocketError = (err) => {
      if (err?.code === 'PROFILE_INCOMPLETE') {
        toast.error(err.message || 'Complete your profile before starting a new chat.');
        return;
      }

      toast.error(err?.message || 'Chat action failed');
    };

    socket.on('error', handleSocketError);

    return () => {
      socket.off('error', handleSocketError);
    };
  }, [socket]);

  const handleBlock = () => {
    if (!currentChat) return;
    if (window.confirm('Are you sure you want to block this user? You will no longer receive messages from them.')) {
      blockMutation.mutate(currentChat._id);
    }
  };

  const handleTogglePin = () => {
    if (!currentChat) return;
    pinMutation.mutate({ userId: currentChat._id, isPinned: currentChat.isPinned });
  };

  const handleImageSend = (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentChat) return;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('receiverId', currentChat._id);
    imageMutation.mutate(formData);
    e.target.value = '';
  };

  const handleMessageSearch = async (e) => {
    const q = e.target.value;
    setMessageSearch(q);
    if (q.trim().length < 2) { setSearchResults(null); return; }
    try {
      const data = await searchMessages(q, currentChat?._id);
      setSearchResults(data.messages || []);
    } catch { setSearchResults([]); }
  };

  const handleReport = () => {
    if (!currentChat) return;

    const reason = window.prompt('Short reason for reporting this chat (for example: spam, scam attempt, abusive language):', 'spam');
    if (!reason || !reason.trim()) return;

    const details = window.prompt('Optional extra details for moderators:', '') || '';
    const latestMessage = [...messages].reverse().find((msg) => getSenderId(msg) === currentChat._id && !msg.isDeleted);

    reportMutation.mutate({
      userId: currentChat._id,
      payload: {
        reason: reason.trim(),
        details: details.trim(),
        messageId: latestMessage?._id?.startsWith?.('temp-') ? null : latestMessage?._id || null,
      },
    });
  };

  // ───── fetch conversations (HTTP, called once + on demand) ─────
  const fetchConversations = useCallback(async () => {
    try {
      const response = await getConversations();
      setConversations(response);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, []);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  // ───── socket event wiring ─────
  useEffect(() => {
    if (!socket || !user) return undefined;

    const handleReceiveMessage = (message) => {
      const messageSenderId = getSenderId(message);
      const messageReceiverId = getReceiverId(message);

      const isForCurrentChat = currentChat && (
        (messageSenderId === user.id && messageReceiverId === currentChat._id) ||
        (messageSenderId === currentChat._id && messageReceiverId === user.id)
      );

      if (isForCurrentChat) {
        setMessages((prev) => {
          // Replace optimistic temp message if this is our own echoed message
          if (messageSenderId === user.id) {
            const withoutTemp = prev.filter(
              (m) => !(m._id?.startsWith?.('temp-') && m.content === message.content)
            );
            const alreadyExists = withoutTemp.some((m) => m._id === message._id);
            return alreadyExists ? withoutTemp : [...withoutTemp, message];
          }

          // For received messages from the other user
          const exists = prev.some((m) => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });

        // If message is from the other user and we are viewing the chat, mark seen
        if (messageSenderId === currentChat._id && socket) {
          socket.emit('mark_seen', { receiverId: currentChat._id });
        }
      } else {
        // Optimistic unread bump for sidebar
        setConversations((prev) => prev.map((conv) => {
          if (conv._id === messageSenderId) {
            return {
              ...conv,
              lastMessage: message.content,
              timestamp: message.timestamp,
              unreadCount: (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        }));
      }

      // Light refresh for sidebar ordering (debounce-friendly since it's just one call)
      fetchConversations();
    };

    const handleEdited = (editedMsg) => {
      setMessages((prev) => prev.map((m) => (m._id === editedMsg._id ? editedMsg : m)));
      // Just update the sidebar lastMessage in-place
      setConversations((prev) => prev.map((conv) => {
        const partnerId = getSenderId(editedMsg) === user.id ? getReceiverId(editedMsg) : getSenderId(editedMsg);
        if (conv._id === partnerId) {
          return { ...conv, lastMessage: editedMsg.content };
        }
        return conv;
      }));
    };

    const handleDeleted = (deletedMsg) => {
      setMessages((prev) => prev.map((m) => (m._id === deletedMsg._id ? deletedMsg : m)));
      setConversations((prev) => prev.map((conv) => {
        const partnerId = getSenderId(deletedMsg) === user.id ? getReceiverId(deletedMsg) : getSenderId(deletedMsg);
        if (conv._id === partnerId) {
          return { ...conv, lastMessage: 'This message was deleted' };
        }
        return conv;
      }));
    };

    const handleMessagesRead = ({ receiverId }) => {
      setMessages((prev) => prev.map((m) => {
        const mReceiverId = getReceiverId(m);
        if (mReceiverId === receiverId) return { ...m, read: true };
        return m;
      }));
    };

    const handleTyping = ({ userId: typerId }) => {
      setTypingUsers((prev) => ({ ...prev, [typerId]: true }));
    };

    const handleStopTyping = ({ userId: typerId }) => {
      setTypingUsers((prev) => ({ ...prev, [typerId]: false }));
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_edited', handleEdited);
    socket.on('message_deleted', handleDeleted);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);
    socket.on('presence_batch', (data) => setOnlineUsers((prev) => ({ ...prev, ...data })));
    socket.on('user_online', ({ userId: uid }) => setOnlineUsers((prev) => ({ ...prev, [uid]: true })));
    socket.on('user_offline', ({ userId: uid }) => setOnlineUsers((prev) => ({ ...prev, [uid]: false })));

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_edited', handleEdited);
      socket.off('message_deleted', handleDeleted);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
      socket.off('presence_batch');
      socket.off('user_online');
      socket.off('user_offline');
    };
  }, [socket, currentChat, user, fetchConversations]);

  // ───── drain offline queue on reconnect ─────
  useEffect(() => {
    if (!socket || !isConnected) return;

    const queue = loadOfflineQueue();
    if (queue.length === 0) return;

    // Clear the queue immediately to avoid double-send on re-render
    saveOfflineQueue([]);

    queue.forEach((item) => {
      const { optimisticId, queuedAt, ...messageData } = item;
      socket.emit('send_message', messageData, (ack) => {
        if (!ack?.success) {
          // Re-queue on failure (e.g. server error)
          const current = loadOfflineQueue();
          current.push(item);
          saveOfflineQueue(current);
        }
      });
    });

    if (queue.length > 0) {
      toast.success(`Sent ${queue.length} queued message${queue.length > 1 ? 's' : ''}`);
    }
  }, [socket, isConnected]);

  // ───── presence query ─────
  useEffect(() => {
    if (socket && conversations.length > 0) {
      socket.emit('get_presence', conversations.map((c) => c._id));
    }
  }, [socket, conversations]);

  // ───── fetch messages when chat is selected ─────
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChat || !isConnected) return;
      try {
        const response = await getConversationMessages(currentChat._id);
        setMessages(response);

        // Optimistic clear unread
        setConversations((prev) => prev.map((conv) =>
          (conv._id === currentChat._id && conv.unreadCount !== 0) ? { ...conv, unreadCount: 0 } : conv
        ));

        // Mark as read via socket only (and persistent HTTP fallback)
        if (socket) {
          socket.emit('mark_seen', { receiverId: currentChat._id });
        }
        markConversationAsRead(currentChat._id).catch(() => { });
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages();
  }, [currentChat, socket, isConnected]);

  // auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ───── deep-link from product page ─────
  useEffect(() => {
    if (location.state?.sellerId && location.state?.sellerName) {
      if (currentChat?._id === location.state.sellerId) return;
      const existing = conversations.find((c) => c._id === location.state.sellerId);
      setCurrentChat(existing || { _id: location.state.sellerId, name: location.state.sellerName });
    }
  }, [location.state, conversations, currentChat?._id]);

  // ───── typing indicator emit ─────
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    if (!socket || !currentChat || editingMessageId) return;

    socket.emit('typing_start', { receiverId: currentChat._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { receiverId: currentChat._id });
    }, 1500);
  };

  // ───── send / edit ─────
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat) return;

    // Stop typing indicator
    if (socket) socket.emit('typing_stop', { receiverId: currentChat._id });

    if (editingMessageId) {
      if (socket) socket.emit('edit_message', { messageId: editingMessageId, newContent: newMessage.trim() });
      setEditingMessageId(null);
      setNewMessage('');
      return;
    }

    const idempotencyKey = generateIdempotencyKey();
    const messageData = {
      receiver: currentChat._id,
      content: newMessage.trim(),
      timestamp: new Date(),
      idempotencyKey,
    };
    const optimisticMessage = {
      ...messageData,
      sender: user.id,
      _id: `temp-${idempotencyKey}`,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');

    if (socket && isConnected) {
      socket.emit('send_message', messageData, (ack) => {
        if (!ack?.success) {
          // Server rejected — remove optimistic message
          setMessages((prev) => prev.filter((m) => m._id !== optimisticMessage._id));
          toast.error(ack?.error || 'Failed to send message');
        }
      });
    } else {
      // Offline: queue the message for later delivery
      const queue = loadOfflineQueue();
      queue.push({ ...messageData, optimisticId: optimisticMessage._id, queuedAt: Date.now() });
      saveOfflineQueue(queue);
      toast('Message queued — will send when reconnected', { icon: '📤' });
    }
  };

  const handleEditInit = (msg) => {
    setEditingMessageId(msg._id);
    setNewMessage(msg.content);
    inputRef.current?.focus();
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setNewMessage('');
  };

  const handleDelete = (msgId) => {
    if (socket && window.confirm('Delete this message?')) {
      socket.emit('delete_message', { messageId: msgId });
    }
  };

  // ───── Escape key to cancel edit ─────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && editingMessageId) cancelEdit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingMessageId]);

  const handleChatSelect = (conversation) => {
    setCurrentChat(conversation);
    setShowMobileChat(true);
  };

  const handleBackToConversations = () => {
    setShowMobileChat(false);
    setCurrentChat(null);
  };

  // ───── date separator helper ─────
  const getDateLabel = (msg, idx) => {
    const msgDate = new Date(msg.timestamp).toDateString();
    if (idx === 0) return formatDateLabel(msg.timestamp);
    const prevDate = new Date(messages[idx - 1].timestamp).toDateString();
    if (msgDate !== prevDate) return formatDateLabel(msg.timestamp);
    return null;
  };

  const isOtherUserTyping = currentChat && typingUsers[currentChat._id];

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className={`flex-none ${showMobileChat ? 'hidden md:block' : ''}`}>
        <Header />
      </div>

      {/* Offline banner */}
      {!isConnected && (
        <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 font-medium flex-none">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>You are offline — messages will be sent when reconnected</span>
        </div>
      )}

      <div className="flex-1 container mx-auto md:p-4 overflow-hidden min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-0 h-full bg-white md:rounded-2xl md:shadow-xl overflow-hidden md:border border-gray-100">
          {/* ───── SIDEBAR ───── */}
          <div className={`border-r border-gray-100 flex flex-col h-full bg-gray-50/30 overflow-hidden ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-100 bg-white flex-none">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-primary-600" />
                Messages
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  onClick={() => handleChatSelect(conversation)}
                  className={`p-3 cursor-pointer flex items-center gap-3 transition-all duration-200 group relative border-l-4 ${currentChat?._id === conversation._id
                    ? 'bg-primary-50/50 border-primary-600'
                    : 'hover:bg-gray-50 border-transparent'
                    }`}
                >
                  <div className="relative inline-flex items-center justify-center shrink-0 w-12 h-12">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] transition-colors ${currentChat?._id === conversation._id
                      ? 'bg-linear-to-br from-primary-500 to-indigo-600 text-white'
                      : 'bg-white text-primary-600 border border-primary-100 group-hover:border-primary-200'
                      }`}>
                      {conversation.name ? conversation.name[0].toUpperCase() : '?'}
                    </div>
                    {onlineUsers[conversation._id] && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full z-10 shadow-sm" />
                    )}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="flex justify-between items-center">
                      <p className={`font-semibold truncate flex items-center gap-1 ${currentChat?._id === conversation._id ? 'text-primary-900' : 'text-gray-700'}`}>
                        {conversation.isPinned && <Pin className="w-3 h-3 text-primary-400 shrink-0" />}
                        {conversation.name}
                      </p>
                      <div className="flex flex-col items-end">
                        {conversation.timestamp && (
                          <span className="text-[10px] text-gray-400">
                            {new Date(conversation.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {conversation.unreadCount > 0 && currentChat?._id !== conversation._id && (
                          <div className="mt-1 bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center shadow-sm">
                            {Math.min(conversation.unreadCount, 99)}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className={`text-xs truncate ${conversation.unreadCount > 0 && currentChat?._id !== conversation._id ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
                      {conversation.lastMessage || 'Click to start chatting'}
                    </p>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div className="text-center py-10 px-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <p className="text-gray-500 font-medium">No conversations yet</p>
                  <p className="text-xs text-gray-400 mt-1">Start chatting with other users!</p>
                </div>
              )}
            </div>
          </div>

          {/* ───── CHAT AREA ───── */}
          <div className={`flex flex-col h-full bg-white min-h-0 overflow-hidden ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
            {currentChat ? (
              <>
                {/* Header */}
                <div className="p-3 md:p-4 border-b border-gray-100 flex items-center bg-white shadow-sm z-10 flex-none">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBackToConversations}
                      className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-bold shadow-md">
                        {currentChat.name ? currentChat.name[0].toUpperCase() : '?'}
                      </div>
                      {onlineUsers[currentChat._id] && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{currentChat.name}</h3>
                      {isOtherUserTyping ? (
                        <div className="flex items-center gap-1 text-xs text-primary-600 font-medium">
                          <span className="flex gap-0.5">
                            <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                          typing...
                        </div>
                      ) : onlineUsers[currentChat._id] ? (
                        <div className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          Online
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          Offline
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTogglePin}
                    disabled={pinMutation.isPending}
                    className={`border-transparent ${currentChat.isPinned ? 'text-primary-600 hover:bg-primary-50' : 'text-gray-500 hover:bg-gray-50'}`}
                    title={currentChat.isPinned ? 'Unpin conversation' : 'Pin conversation'}
                  >
                    {currentChat.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReport}
                    disabled={reportMutation.isPending}
                    className="text-amber-700 hover:bg-amber-50 hover:border-amber-200 ml-auto border-transparent"
                    title="Report Chat"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Report</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBlock}
                    disabled={blockMutation.isPending}
                    className="text-red-600 hover:bg-red-50 hover:border-red-200 border-transparent"
                    title="Block User"
                  >
                    <Ban className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Block</span>
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-1 bg-slate-50 scroll-smooth">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
                      <MessageSquare className="w-12 h-12 mb-4 text-gray-300" />
                      <p className="font-semibold text-gray-500">No messages yet</p>
                      <p className="text-xs mt-1">Say hi to start the conversation! 👋</p>
                    </div>
                  )}

                  {messages.map((message, idx) => {
                    const messageSenderId = getSenderId(message);
                    const isMe = messageSenderId === user.id;
                    const isTemp = message._id?.startsWith?.('temp-');
                    const showSpacing = idx > 0 && getSenderId(messages[idx - 1]) !== messageSenderId;
                    const dateLabel = getDateLabel(message, idx);

                    return (
                      <React.Fragment key={message._id || idx}>
                        {dateLabel && (
                          <div className="flex justify-center my-4">
                            <span className="px-3 py-1 text-[11px] font-medium text-gray-500 bg-white rounded-full shadow-sm border border-gray-100">
                              {dateLabel}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group ${showSpacing ? 'mt-4' : 'mt-1'}`}>
                          <div className={`max-w-[85%] md:max-w-[70%] relative ${isMe ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                            {/* Action buttons — positioned above the bubble */}
                            {isMe && !message.isDeleted && !isTemp && (
                              <div className="hidden group-hover:flex items-center gap-1 mb-1 bg-white shadow-sm p-0.5 rounded-lg border border-gray-100">
                                <button onClick={() => handleEditInit(message)} className="p-1 text-gray-400 hover:text-primary-600 rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDelete(message._id)} className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            )}

                            <div className={`px-3 py-2 text-sm leading-relaxed relative flex flex-col min-w-[80px] ${message.isDeleted
                              ? 'bg-gray-100 text-gray-400 italic rounded-2xl shadow-sm border border-gray-200'
                              : isMe
                                ? 'bg-linear-to-br from-primary-500 to-indigo-600 text-white shadow-md shadow-primary-500/20 rounded-2xl rounded-tr-sm'
                                : 'bg-white text-gray-800 shadow-sm shadow-gray-200/50 rounded-2xl rounded-tl-sm border border-gray-100/50'
                              }`}>
                              {message.isDeleted ? (
                                <span className="flex items-center gap-1">🚫 This message was deleted.</span>
                              ) : (
                                <>
                                  <div className="pb-3 wrap-break-words pr-4">{message.content}</div>
                                  <div className={`flex items-center gap-1 whitespace-nowrap text-[10px] absolute bottom-1 right-2 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                    {message.isEdited && <span>(edited)</span>}
                                    <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {isMe && !isTemp && (
                                      message.read ? (
                                        <div className="flex items-center gap-0.5">
                                          <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
                                          <span className="text-blue-300">Read</span>
                                        </div>
                                      ) : message.delivered ? (
                                        <div className="flex items-center gap-0.5">
                                          <CheckCheck className="w-3.5 h-3.5 opacity-70" />
                                          <span className="opacity-70">Delivered</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-0.5">
                                          <Check className="w-3 h-3 opacity-70" />
                                          <span className="opacity-70">Sent</span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 md:p-4 border-t border-gray-100 bg-white flex-none">
                  {/* Message search */}
                  <div className="mb-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={messageSearch}
                        onChange={handleMessageSearch}
                        placeholder="Search messages…"
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-300"
                      />
                    </div>
                    {searchResults !== null && (
                      <div className="mt-1 max-h-32 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-sm text-xs">
                        {searchResults.length === 0 ? (
                          <p className="p-2 text-gray-400 text-center">No messages found</p>
                        ) : searchResults.map((m) => (
                          <div key={m._id} className="px-3 py-2 border-b border-gray-50 last:border-0">
                            <span className="text-gray-500">{new Date(m.timestamp).toLocaleDateString()}: </span>
                            <span className="text-gray-700">{m.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {editingMessageId && (
                    <div className="flex items-center justify-between bg-primary-50 text-primary-700 text-xs px-4 py-2 mb-2 rounded-xl border border-primary-100">
                      <span className="flex items-center gap-2 font-medium"><Edit2 className="w-3.5 h-3.5" /> Editing message… <span className="text-primary-400">(Esc to cancel)</span></span>
                      <button onClick={cancelEdit} className="p-1 hover:bg-primary-100 rounded-full transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  )}
                  {messages.length < 5 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-2">
                      {QUICK_TEMPLATES.map((template, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNewMessage(template)}
                          className="shrink-0 bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs px-3 py-1.5 rounded-full border border-primary-100 transition-colors whitespace-nowrap"
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  )}
                  <form onSubmit={sendMessage} className="flex gap-2 md:gap-3 items-end max-w-4xl mx-auto">
                    {/* Image upload */}
                    <label className="shrink-0 cursor-pointer p-2 rounded-xl hover:bg-gray-100 transition-colors" title="Send image">
                      <Image className="w-5 h-5 text-gray-400" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageSend} />
                    </label>
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={handleInputChange}
                      placeholder={editingMessageId ? 'Edit your message...' : 'Type a message'}
                      className={`flex-1 bg-gray-50 focus:bg-white transition-all rounded-2xl px-4 py-3 shadow-inner ${editingMessageId ? 'border-primary-200' : 'border-gray-200'}`}
                    />
                    <Button
                      type="submit"
                      className="rounded-xl w-12 h-12 shrink-0 p-0 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 bg-primary-600 hover:bg-primary-700"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50/30">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-600 mb-2">Your Messages</h3>
                <p className="text-gray-400 max-w-xs text-center">Select a conversation from the sidebar to start chatting with other users.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
