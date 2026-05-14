import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MessageSquare, WifiOff, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useSocket, useSocketStatus } from '../../../context/SocketContext';
import { Dialog, DialogContent, DialogTitle } from '../../../components/ui/Dialog';
import Header from '../../../components/Header';
import { 
  getConversationMessages, 
  markConversationAsRead 
} from '../api/chatApi';

import ChatSidebar from '../components/ChatSidebar';
import ChatHeader from '../components/ChatHeader';
import ChatMessageList from '../components/ChatMessageList';
import ChatInput from '../components/ChatInput';

import { useChatData } from '../hooks/useChatData';
import { useChatSocket } from '../hooks/useChatSocket';
import { useChatState, loadOfflineQueue, saveOfflineQueue, generateIdempotencyKey } from '../hooks/useChatState';

const getSenderId = (msg) => (typeof msg.sender === 'object' ? msg.sender._id : msg.sender);

function ChatPage() {
  const { user } = useAuth();
  const socket = useSocket();
  const isConnected = useSocketStatus();
  const location = useLocation();

  const [currentChat, setCurrentChat] = useState(null);

  const {
    conversations, setConversations, loadingConversations,
    messages, setMessages, hasMore, setHasMore, loadingMore, setLoadingMore,
    fetchConversations, blockMutation, pinMutation, imageMutation, reportMutation
  } = useChatData();

  const {
    newMessage, setNewMessage, editingMessageId, setEditingMessageId,
    showMobileChat, setShowMobileChat, messageSearch, searchResults,
    viewerVisible, setViewerVisible, viewerUri, setViewerUri,
    conversationSearch, setConversationSearch, inputRef, typingTimeoutRef,
    handleMessageSearch, cancelEdit
  } = useChatState(currentChat);

  const { onlineUsers, typingUsers } = useChatSocket(
    socket, user, currentChat, setMessages, setConversations, fetchConversations
  );

  const scrollRef = useRef();

  // ───── socket error handling ─────
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
    return () => socket.off('error', handleSocketError);
  }, [socket]);

  // ───── fetch conversations initial ─────
  useEffect(() => {
    if (user) fetchConversations(true);
  }, [user, fetchConversations]);

  // ───── fetch messages when chat is selected ─────
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChat || !isConnected) return;
      try {
        const response = await getConversationMessages(currentChat._id);
        setMessages(response);
        setHasMore(response.length === 50);
        setConversations((prev) => prev.map((conv) =>
          (conv._id === currentChat._id && conv.unreadCount !== 0) ? { ...conv, unreadCount: 0 } : conv
        ));
        if (socket) socket.emit('mark_seen', { receiverId: currentChat._id });
        markConversationAsRead(currentChat._id).catch(() => { });
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages();
  }, [currentChat, socket, isConnected, setMessages, setHasMore, setConversations]);

  // ───── drain offline queue on reconnect ─────
  useEffect(() => {
    if (!socket || !isConnected) return;
    const queue = loadOfflineQueue();
    if (queue.length === 0) return;
    saveOfflineQueue([]);
    queue.forEach((item) => {
      const { ...messageData } = item;
      socket.emit('send_message', messageData, (ack) => {
        if (!ack?.success) {
          const current = loadOfflineQueue();
          current.push(item);
          saveOfflineQueue(current);
        }
      });
    });
    toast.success(`Sent ${queue.length} queued message${queue.length > 1 ? 's' : ''}`);
  }, [socket, isConnected]);

  // ───── presence query ─────
  useEffect(() => {
    if (socket && conversations.length > 0) {
      socket.emit('get_presence', conversations.map((c) => c._id));
    }
  }, [socket, conversations]);

  // ───── scroll management ─────
  const lastMessageId = messages.length > 0 ? messages[messages.length - 1]._id : null;
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lastMessageId]);

  const handleScroll = async (e) => {
    if (e.target.scrollTop === 0 && hasMore && !loadingMore && messages.length > 0) {
      setLoadingMore(true);
      const oldestMessage = messages[0];
      try {
        const scrollHeightBefore = e.target.scrollHeight;
        const response = await getConversationMessages(currentChat._id, oldestMessage.createdAt || oldestMessage.timestamp);
        if (response.length > 0) {
          setMessages(prev => [...response, ...prev]);
          setHasMore(response.length === 50);
          setTimeout(() => {
            if (e.target) {
              const scrollHeightAfter = e.target.scrollHeight;
              e.target.scrollTop = scrollHeightAfter - scrollHeightBefore;
            }
          }, 0);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error fetching older messages:', error);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  // ───── deep-link from product page ─────
  useEffect(() => {
    if (location.state?.sellerId && location.state?.sellerName) {
      if (currentChat?._id === location.state.sellerId) return;
      const existing = conversations.find((c) => c._id === location.state.sellerId);
      setCurrentChat(existing || { _id: location.state.sellerId, name: location.state.sellerName });
    }
  }, [location.state, conversations, currentChat?._id]);

  // ───── handlers ─────
  const handleBlock = () => {
    if (!currentChat) return;
    if (window.confirm('Are you sure you want to block this user?')) {
      blockMutation.mutate(currentChat._id, { onSuccess: () => setCurrentChat(null) });
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

  const handleReport = () => {
    if (!currentChat) return;
    const reason = window.prompt('Short reason for reporting this chat:', 'spam');
    if (!reason || !reason.trim()) return;
    const details = window.prompt('Optional extra details:', '') || '';
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

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !currentChat || editingMessageId) return;
    socket.emit('typing_start', { receiverId: currentChat._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { receiverId: currentChat._id });
    }, 1500);
  };

  const sendMessage = (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !currentChat) return;
    if (socket) socket.emit('typing_stop', { receiverId: currentChat._id });

    if (editingMessageId) {
      if (socket) socket.emit('edit_message', { messageId: editingMessageId, newContent: newMessage.trim() });
      cancelEdit();
      return;
    }

    const idempotencyKey = generateIdempotencyKey();
    const messageData = { receiver: currentChat._id, content: newMessage.trim(), timestamp: new Date(), idempotencyKey };
    const optimisticMessage = { ...messageData, sender: user.id, _id: `temp-${idempotencyKey}` };
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');

    if (socket && isConnected) {
      socket.emit('send_message', messageData, (ack) => {
        if (!ack?.success) {
          setMessages((prev) => prev.filter((m) => m._id !== optimisticMessage._id));
          toast.error(ack?.error || 'Failed to send message');
        }
      });
    } else {
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

  const handleDelete = (msgId) => {
    if (socket && window.confirm('Delete this message?')) {
      socket.emit('delete_message', { messageId: msgId });
    }
  };

  const handleChatSelect = (conversation) => {
    setCurrentChat(conversation);
    setShowMobileChat(true);
  };

  const handleBackToConversations = () => {
    setShowMobileChat(false);
    setCurrentChat(null);
  };

  const isOtherUserTyping = currentChat && typingUsers[currentChat._id];

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className={`flex-none ${showMobileChat ? 'hidden md:block' : ''}`}>
        <Header />
      </div>

      {!isConnected && (
        <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 font-medium flex-none">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>You are offline — messages will be sent when reconnected</span>
        </div>
      )}

      <div className="flex-1 w-full overflow-hidden min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-0 h-full bg-white overflow-hidden border-t border-gray-100">
          <ChatSidebar
            conversations={conversations}
            loadingConversations={loadingConversations}
            currentChat={currentChat}
            showMobileChat={showMobileChat}
            onlineUsers={onlineUsers}
            conversationSearch={conversationSearch}
            setConversationSearch={setConversationSearch}
            handleChatSelect={handleChatSelect}
          />

          <div className={`flex flex-col h-full bg-white min-h-0 overflow-hidden ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
            {currentChat ? (
              <>
                <ChatHeader
                  currentChat={currentChat}
                  onlineUsers={onlineUsers}
                  isOtherUserTyping={isOtherUserTyping}
                  handleBackToConversations={handleBackToConversations}
                  handleTogglePin={handleTogglePin}
                  handleReport={handleReport}
                  handleBlock={handleBlock}
                  pinMutationPending={pinMutation.isPending}
                  reportMutationPending={reportMutation.isPending}
                  blockMutationPending={blockMutation.isPending}
                />

                <ChatMessageList
                  messages={messages}
                  user={user}
                  loadingMore={loadingMore}
                  hasMore={hasMore}
                  handleScroll={handleScroll}
                  scrollRef={scrollRef}
                  handleEditInit={handleEditInit}
                  handleDelete={handleDelete}
                  setViewerUri={setViewerUri}
                  setViewerVisible={setViewerVisible}
                />

                <ChatInput
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  editingMessageId={editingMessageId}
                  cancelEdit={cancelEdit}
                  sendMessage={sendMessage}
                  handleInputChange={handleInputChange}
                  handleImageSend={handleImageSend}
                  handleMessageSearch={handleMessageSearch}
                  messageSearch={messageSearch}
                  searchResults={searchResults}
                  inputRef={inputRef}
                  messagesCount={messages.length}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50/30">
                <div className="w-24 h-24 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="w-10 h-10 text-primary-200" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Your Messages</h3>
                <p className="text-gray-500 max-w-xs text-center text-sm">Select a conversation from the sidebar.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={viewerVisible} onOpenChange={setViewerVisible}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-0 rounded-4xl z-50" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Full Photo Viewer</DialogTitle>
          <div className="relative aspect-auto w-full h-[85vh] flex items-center justify-center p-4">
            {viewerUri && (
              <img src={viewerUri} alt="Full screen attachment" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            )}
            <button onClick={() => setViewerVisible(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ChatPage;
