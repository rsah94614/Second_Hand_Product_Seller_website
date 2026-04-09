import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import { Send, MessageSquare, MoreVertical, Phone, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import Header from '../../../components/Header';
import { SOCKET_URL } from '../../../config/api';
import { getConversationMessages, getConversations, markConversationAsRead } from '../api/chatApi';

function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const scrollRef = useRef();

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const token = localStorage.getItem('token');
    const nextSocket = io(SOCKET_URL, {
      auth: {
        token: token ? `Bearer ${token}` : '',
      },
    });

    setSocket(nextSocket);

    nextSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    nextSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => nextSocket.close();
  }, [user]);

  const fetchConversations = async () => {
    try {
      if (!localStorage.getItem('token')) {
        return;
      }

      const response = await getConversations();
      setConversations(response);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (!socket || !user) {
      return undefined;
    }

    const handleReceiveMessage = (message) => {
      const messageSenderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
      const messageReceiverId = typeof message.receiver === 'object' ? message.receiver._id : message.receiver;

      const isMessageForCurrentChat = currentChat && (
        (messageSenderId === user.id && messageReceiverId === currentChat._id) ||
        (messageSenderId === currentChat._id && messageReceiverId === user.id)
      );

      if (isMessageForCurrentChat) {
        setMessages((prev) => {
          const exists = prev.some((item) => {
            const itemSenderId = typeof item.sender === 'object' ? item.sender._id : item.sender;
            const itemReceiverId = typeof item.receiver === 'object' ? item.receiver._id : item.receiver;

            return item._id === message._id || (
              itemSenderId === messageSenderId &&
              itemReceiverId === messageReceiverId &&
              item.content === message.content &&
              Math.abs(new Date(item.timestamp) - new Date(message.timestamp)) < 1000
            );
          });

          if (exists) return prev;
          return [...prev, message];
        });
        
        // Mark read immediately if we are viewing the chat
        if (messageSenderId === currentChat._id) {
          markConversationAsRead(currentChat._id).catch(console.error);
        }
      } else {
        // Increment unread count for the other conversation
        setConversations((prev) => prev.map((conv) => {
          if (conv._id === messageSenderId) {
            return {
              ...conv,
              lastMessage: message.content,
              timestamp: message.timestamp,
              unreadCount: (conv.unreadCount || 0) + 1
            };
          }
          return conv;
        }));
      }

      fetchConversations();
    };

    socket.on('receive_message', handleReceiveMessage);
    
    socket.on('presence_batch', (presenceData) => {
      setOnlineUsers((prev) => ({ ...prev, ...presenceData }));
    });

    socket.on('user_online', ({ userId }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: true }));
    });

    socket.on('user_offline', ({ userId }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: false }));
    });

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('presence_batch');
      socket.off('user_online');
      socket.off('user_offline');
    };
  }, [socket, currentChat, user]);

  useEffect(() => {
    if (socket && conversations.length > 0) {
      const userIds = conversations.map(c => c._id);
      socket.emit('get_presence', userIds);
    }
  }, [socket, conversations]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChat) return;

      try {
        if (!localStorage.getItem('token')) return;

        const response = await getConversationMessages(currentChat._id);
        setMessages(response);
        
        // Optimistic clear unread
        setConversations(prev => prev.map(conv => 
          (conv._id === currentChat._id && conv.unreadCount !== 0) ? { ...conv, unreadCount: 0 } : conv
        ));
        
        // Mark as read in backend
        await markConversationAsRead(currentChat._id);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [currentChat]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (location.state?.sellerId && location.state?.sellerName) {
      if (currentChat?._id === location.state.sellerId) {
        return;
      }
      
      const existing = conversations.find((conversation) => conversation._id === location.state.sellerId);
      if (existing) {
        setCurrentChat(existing);
      } else {
        setCurrentChat({
          _id: location.state.sellerId,
          name: location.state.sellerName,
        });
      }
    }
  }, [location.state, conversations, currentChat?._id]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentChat) {
      return;
    }

    const messageData = {
      receiver: currentChat._id,
      content: newMessage.trim(),
      timestamp: new Date(),
    };

    const optimisticMessage = {
      ...messageData,
      sender: user.id,
      _id: `temp-${Date.now()}`,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');

    if (socket) {
      socket.emit('send_message', messageData);
    } else {
      setMessages((prev) => prev.filter((message) => message._id !== optimisticMessage._id));
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

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className={`flex-none ${showMobileChat ? 'hidden md:block' : ''}`}>
        <Header />
      </div>

      <div className="flex-1 container mx-auto md:p-4 overflow-hidden min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-6 h-full bg-white md:rounded-2xl md:shadow-xl overflow-hidden md:border border-gray-100">
          <div className={`md:col-span-1 border-r border-gray-100 flex flex-col h-full bg-gray-50/30 overflow-hidden ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-100 bg-white flex-none">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-primary-600" />
                Messages
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  onClick={() => handleChatSelect(conversation)}
                  className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all duration-200 group relative ${
                    currentChat?._id === conversation._id
                      ? 'bg-primary-50 shadow-sm border border-primary-100'
                      : 'hover:bg-white hover:shadow-sm border border-transparent'
                  }`}
                >
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm transition-colors ${
                      currentChat?._id === conversation._id
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-primary-600 border border-primary-100 group-hover:border-primary-200'
                    }`}>
                      {conversation.name ? conversation.name[0].toUpperCase() : '?'}
                    </div>
                    {onlineUsers[conversation._id] && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="flex justify-between items-center">
                      <p className={`font-semibold truncate ${currentChat?._id === conversation._id ? 'text-primary-900' : 'text-gray-700'}`}>
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

          <div className={`md:col-span-3 flex flex-col h-full bg-white min-h-0 overflow-hidden ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
            {currentChat ? (
              <>
                <div className="p-3 md:p-4 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm z-10 flex-none">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBackToConversations}
                      className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>

                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-bold shadow-md">
                        {currentChat.name ? currentChat.name[0].toUpperCase() : '?'}
                      </div>
                      {onlineUsers[currentChat._id] && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{currentChat.name}</h3>
                      {onlineUsers[currentChat._id] ? (
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
                  <div className="hidden md:flex gap-2 text-gray-400">
                    <Button variant="ghost" size="icon" className="hover:text-primary-600 hover:bg-primary-50">
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="hover:text-primary-600 hover:bg-primary-50">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50/50 scroll-smooth">
                  {messages.map((message, idx) => {
                    const messageSenderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
                    const isMe = messageSenderId === user.id;
                    return (
                      <div key={message._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                        <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`px-4 md:px-5 py-2.5 md:py-3 rounded-2xl shadow-sm text-sm leading-relaxed relative ${
                            isMe
                              ? 'bg-primary-600 text-white rounded-br-none'
                              : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                          }`}>
                            {message.content}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 px-1">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>

                <div className="p-3 md:p-4 bg-white border-t border-gray-100 flex-none">
                  <form onSubmit={sendMessage} className="flex gap-2 md:gap-3 items-center max-w-4xl mx-auto">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message"
                      className="flex-1 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-full px-4 md:px-6 py-3 md:py-6 shadow-inner text-sm md:text-base"
                    />
                    <Button
                      type="submit"
                      size="lg"
                      className="rounded-full w-12 h-12 p-0 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all bg-primary-600 hover:bg-primary-700"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50/30">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
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
