import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  getConversations, 
  pinConversation, 
  unpinConversation, 
  reportChatUser, 
  uploadChatImage
} from '../api/chatApi';
import { blockUser } from '../../users/api/userApi';

export const useChatData = () => {
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchConversations = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoadingConversations(true);
      const response = await getConversations();
      setConversations(response);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const blockMutation = useMutation({
    mutationFn: (userId) => blockUser(userId),
    onSuccess: () => {
      toast.success('User blocked successfully');
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
    onSuccess: () => toast.success('Chat reported to moderators'),
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to submit chat report'),
  });

  return {
    conversations,
    setConversations,
    loadingConversations,
    messages,
    setMessages,
    hasMore,
    setHasMore,
    loadingMore,
    setLoadingMore,
    fetchConversations,
    blockMutation,
    pinMutation,
    imageMutation,
    reportMutation
  };
};
