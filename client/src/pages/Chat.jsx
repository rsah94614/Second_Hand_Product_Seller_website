import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Send, User, MessageSquare, MoreVertical, Phone, MapPin, ArrowLeft, Menu } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ENDPOINT = 'http://localhost:5000';

function Chat() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [showMobileChat, setShowMobileChat] = useState(false); // Mobile view state
    const scrollRef = useRef();

    // Initialize Socket
    useEffect(() => {
        if (user) {
            const newSocket = io(ENDPOINT);
            console.log('🔌 Socket connecting to:', ENDPOINT);
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('✅ Socket connected successfully, ID:', newSocket.id);
                newSocket.emit('join_room', user.id);
                console.log('🚪 Joined room:', user.id);
            });

            // Handle socket errors
            newSocket.on('error', (error) => {
                console.error('Socket error:', error);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });

            return () => newSocket.close();
        }
    }, [user]);

    // Fetch Conversations
    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('⚠️ No token found, skipping conversation fetch');
                return;
            }
            const res = await axios.get('http://localhost:5000/api/chat/conversations/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Conversations fetched:', res.data);
            setConversations(res.data);
        } catch (err) {
            console.error('Error fetching conversations:', err);
        }
    };

    useEffect(() => {
        if (user) fetchConversations();
    }, [user]); // Fetch when user is available

    // Handle incoming messages
    useEffect(() => {
        if (socket) {
            const handleReceiveMessage = (message) => {
                console.log('Received message:', message);

                // Extract IDs from message (handle both populated objects and direct IDs)
                const messageSenderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
                const messageReceiverId = typeof message.receiver === 'object' ? message.receiver._id : message.receiver;

                // Check if message belongs to current conversation
                const isMessageForCurrentChat = currentChat && (
                    (messageSenderId === user.id && messageReceiverId === currentChat._id) ||
                    (messageSenderId === currentChat._id && messageReceiverId === user.id)
                );

                if (isMessageForCurrentChat) {
                    setMessages((prev) => {
                        // Check for duplicates using _id or a combination of fields
                        const exists = prev.some(m => {
                            const mSenderId = typeof m.sender === 'object' ? m.sender._id : m.sender;
                            const mReceiverId = typeof m.receiver === 'object' ? m.receiver._id : m.receiver;

                            return m._id === message._id ||
                                (mSenderId === messageSenderId &&
                                    mReceiverId === messageReceiverId &&
                                    m.content === message.content &&
                                    Math.abs(new Date(m.timestamp) - new Date(message.timestamp)) < 1000);
                        });
                        if (exists) return prev;
                        return [...prev, message];
                    });
                }

                // Refresh conversations to update sidebar with new message
                fetchConversations();
            };

            socket.on('receive_message', handleReceiveMessage);

            return () => {
                socket.off('receive_message', handleReceiveMessage);
            };
        }
    }, [socket, currentChat, user]);

    // Fetch Messages for current chat
    useEffect(() => {
        const fetchMessages = async () => {
            if (currentChat) {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        console.log('⚠️ No token found, cannot fetch messages');
                        return;
                    }
                    const res = await axios.get(`http://localhost:5000/api/chat/${currentChat._id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('Messages fetched:', res.data);
                    setMessages(res.data);
                } catch (err) {
                    console.error('Error fetching messages:', err);
                }
            }
        };
        if (currentChat) fetchMessages();
    }, [currentChat]); // Fetch when chat changes

    // Scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Check if navigated from ProductDetail with a seller
    useEffect(() => {
        if (location.state?.sellerId && location.state?.sellerName) {
            const existing = conversations.find(c => c._id === location.state.sellerId);
            if (existing) {
                setCurrentChat(existing);
            } else {
                setCurrentChat({
                    _id: location.state.sellerId,
                    name: location.state.sellerName
                });
            }
        }
    }, [location.state, conversations]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentChat) return;

        const messageData = {
            sender: user.id,
            receiver: currentChat._id,
            content: newMessage,
            timestamp: new Date(),
        };

        console.log('📤 Sending message:', messageData);

        // Optimistic UI update - add message immediately
        const optimisticMessage = {
            ...messageData,
            _id: `temp-${Date.now()}`, // Temporary ID
        };
        setMessages((prev) => [...prev, optimisticMessage]);
        console.log('✨ Added optimistic message to UI');
        setNewMessage('');

        // Send via socket
        if (socket) {
            console.log('📡 Emitting send_message via socket...');
            socket.emit('send_message', messageData);
        } else {
            console.error('❌ Socket not connected');
            // Remove optimistic message if socket fails
            setMessages((prev) => prev.filter(m => m._id !== optimisticMessage._id));
        }
    };

    // Handle chat selection on mobile
    const handleChatSelect = (conv) => {
        setCurrentChat(conv);
        setShowMobileChat(true); // Show chat view on mobile
    };

    // Handle back to conversations on mobile
    const handleBackToConversations = () => {
        setShowMobileChat(false);
        setCurrentChat(null);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
            {/* Hide Header on mobile when in chat view */}
            <div className={`flex-none ${showMobileChat ? 'hidden md:block' : ''}`}>
                <Header />
            </div>

            <div className="flex-1 container mx-auto md:p-4 overflow-hidden min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-6 h-full bg-white md:rounded-2xl md:shadow-xl overflow-hidden md:border border-gray-100">

                    {/* Sidebar - Hide on mobile when chat is open */}
                    <div className={`md:col-span-1 border-r border-gray-100 flex flex-col h-full bg-gray-50/30 overflow-hidden ${showMobileChat ? 'hidden md:flex' : 'flex'
                        }`}>
                        <div className="p-4 border-b border-gray-100 bg-white flex-none">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <MessageSquare className="w-6 h-6 text-primary-600" />
                                Messages
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {conversations.map((conv) => (
                                <div
                                    key={conv._id}
                                    onClick={() => handleChatSelect(conv)}
                                    className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all duration-200 group ${currentChat?._id === conv._id
                                        ? 'bg-primary-50 shadow-sm border border-primary-100'
                                        : 'hover:bg-white hover:shadow-sm border border-transparent'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm transition-colors ${currentChat?._id === conv._id
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-white text-primary-600 border border-primary-100 group-hover:border-primary-200'
                                        }`}>
                                        {conv.name ? conv.name[0].toUpperCase() : '?'}
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className={`font-semibold truncate ${currentChat?._id === conv._id ? 'text-primary-900' : 'text-gray-700'}`}>
                                                {conv.name}
                                            </p>
                                            {conv.timestamp && (
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">
                                            {conv.lastMessage || 'Click to start chatting'}
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
                                    <p className="text-xs text-gray-400 mt-1">Start chatting with sellers!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area - Show on mobile when chat is selected */}
                    <div className={`md:col-span-3 flex flex-col h-full bg-white min-h-0 overflow-hidden ${showMobileChat ? 'flex' : 'hidden md:flex'
                        }`}>
                        {currentChat ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-3 md:p-4 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm z-10 flex-none">
                                    <div className="flex items-center gap-3">
                                        {/* Back button - only on mobile */}
                                        <button
                                            onClick={handleBackToConversations}
                                            className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <ArrowLeft className="w-5 h-5 text-gray-700" />
                                        </button>

                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center font-bold shadow-md">
                                            {currentChat.name ? currentChat.name[0].toUpperCase() : '?'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{currentChat.name}</h3>
                                            <div className="flex items-center gap-1 text-xs text-green-500">
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                Online
                                            </div>
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

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50/50 scroll-smooth">
                                    {messages.map((msg, idx) => {
                                        // Handle both populated and direct ID formats
                                        const msgSenderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
                                        const isMe = msgSenderId === user.id;
                                        return (
                                            <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                                <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className={`px-4 md:px-5 py-2.5 md:py-3 rounded-2xl shadow-sm text-sm leading-relaxed relative ${isMe
                                                        ? 'bg-primary-600 text-white rounded-br-none'
                                                        : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                                                        }`}>
                                                        {msg.content}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={scrollRef} />
                                </div>

                                {/* Input Area */}
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
                                <p className="text-gray-400 max-w-xs text-center">Select a conversation from the sidebar to start chatting with buyers or sellers.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Chat;
