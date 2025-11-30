import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Send, User, MessageSquare } from 'lucide-react';
import axios from 'axios';

const ENDPOINT = 'http://localhost:5000';

function Chat() {
    const { user, token } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef();

    // Initialize Socket
    useEffect(() => {
        if (user) {
            const newSocket = io(ENDPOINT);
            setSocket(newSocket);
            newSocket.emit('join_room', user._id);

            return () => newSocket.close();
        }
    }, [user]);

    // Fetch Conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/chat/conversations/all', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setConversations(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        if (token) fetchConversations();
    }, [token]);

    // Handle incoming messages
    useEffect(() => {
        if (socket) {
            socket.on('receive_message', (message) => {
                if (currentChat && (message.sender === currentChat._id || message.sender === user._id)) {
                    setMessages((prev) => [...prev, message]);
                }
                // Refresh conversations to update last message/timestamp
                // In a real app, you'd update the state locally to avoid a fetch
            });
        }
    }, [socket, currentChat, user]);

    // Fetch Messages for current chat
    useEffect(() => {
        const fetchMessages = async () => {
            if (currentChat) {
                try {
                    const res = await axios.get(`http://localhost:5000/api/chat/${currentChat._id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setMessages(res.data);
                } catch (err) {
                    console.error(err);
                }
            }
        };
        if (currentChat && token) fetchMessages();
    }, [currentChat, token]);

    // Scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Check if navigated from ProductDetail with a seller
    useEffect(() => {
        if (location.state?.sellerId && location.state?.sellerName) {
            // Check if conversation already exists
            const existing = conversations.find(c => c._id === location.state.sellerId);
            if (existing) {
                setCurrentChat(existing);
            } else {
                // Create temporary chat object
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
            sender: user._id,
            receiver: currentChat._id,
            content: newMessage,
            timestamp: new Date(),
        };

        // Emit to socket
        socket.emit('send_message', messageData);

        // Optimistically update UI
        setMessages((prev) => [...prev, messageData]);
        setNewMessage('');
    };

    return (
        <div className="container mx-auto p-4 h-[calc(100vh-80px)]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
                {/* Sidebar */}
                <Card className="md:col-span-1 p-4 overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" /> Chats
                    </h2>
                    <div className="space-y-2">
                        {conversations.map((conv) => (
                            <div
                                key={conv._id}
                                onClick={() => setCurrentChat(conv)}
                                className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 hover:bg-gray-100 transition-colors ${currentChat?._id === conv._id ? 'bg-primary-50 border-primary-200 border' : ''
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                    {conv.name[0].toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-semibold truncate">{conv.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                                </div>
                            </div>
                        ))}
                        {conversations.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No conversations yet.</p>
                        )}
                    </div>
                </Card>

                {/* Chat Area */}
                <Card className="md:col-span-3 flex flex-col h-full">
                    {currentChat ? (
                        <>
                            <div className="p-4 border-b flex items-center gap-3 bg-gray-50 rounded-t-lg">
                                <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                                    {currentChat.name[0].toUpperCase()}
                                </div>
                                <h3 className="font-bold text-lg">{currentChat.name}</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                                {messages.map((msg, idx) => {
                                    const isMe = msg.sender === user._id;
                                    return (
                                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] p-3 rounded-2xl ${isMe
                                                    ? 'bg-primary-600 text-white rounded-br-none'
                                                    : 'bg-white border border-gray-200 rounded-bl-none'
                                                }`}>
                                                <p>{msg.content}</p>
                                                <span className={`text-[10px] block mt-1 ${isMe ? 'text-primary-100' : 'text-gray-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={scrollRef} />
                            </div>

                            <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1"
                                />
                                <Button type="submit" size="icon">
                                    <Send className="w-5 h-5" />
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                            <p>Select a conversation to start chatting</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default Chat;
