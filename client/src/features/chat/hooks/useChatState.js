import { useState, useRef, useEffect } from 'react';
import { searchMessages } from '../api/chatApi';

const OFFLINE_QUEUE_KEY = 'chat_offline_queue';

export const loadOfflineQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveOfflineQueue = (queue) => {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch { /* storage full — ignore */ }
};

export const generateIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const useChatState = (currentChat) => {
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUri, setViewerUri] = useState(null);
  const [conversationSearch, setConversationSearch] = useState('');

  const inputRef = useRef();
  const typingTimeoutRef = useRef(null);

  const handleMessageSearch = async (e) => {
    const q = typeof e === 'string' ? e : e.target.value;
    setMessageSearch(q);
    if (q.trim().length < 2) { setSearchResults(null); return; }
    try {
      const data = await searchMessages(q, currentChat?._id);
      setSearchResults(data.messages || []);
    } catch { setSearchResults([]); }
  };

  useEffect(() => {
    setConversationSearch('');
    setMessageSearch('');
    setSearchResults(null);
  }, [currentChat]);

  const cancelEdit = () => {
    setEditingMessageId(null);
    setNewMessage('');
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && editingMessageId) cancelEdit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingMessageId]);

  return {
    newMessage,
    setNewMessage,
    editingMessageId,
    setEditingMessageId,
    showMobileChat,
    setShowMobileChat,
    messageSearch,
    setMessageSearch,
    searchResults,
    setSearchResults,
    viewerVisible,
    setViewerVisible,
    viewerUri,
    setViewerUri,
    conversationSearch,
    setConversationSearch,
    inputRef,
    typingTimeoutRef,
    handleMessageSearch,
    cancelEdit
  };
};
