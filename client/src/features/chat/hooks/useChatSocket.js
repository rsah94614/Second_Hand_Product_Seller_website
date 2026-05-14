import { useState, useEffect } from 'react';

const getSenderId = (msg) => (typeof msg.sender === 'object' ? msg.sender._id : msg.sender);
const getReceiverId = (msg) => (typeof msg.receiver === 'object' ? msg.receiver._id : msg.receiver);

export const useChatSocket = (socket, user, currentChat, setMessages, setConversations, fetchConversations) => {
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

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
          if (messageSenderId === user.id) {
            const withoutTemp = prev.filter(
              (m) => !(m._id?.startsWith?.('temp-') && m.content === message.content)
            );
            const alreadyExists = withoutTemp.some((m) => m._id === message._id);
            return alreadyExists ? withoutTemp : [...withoutTemp, message];
          }
          const exists = prev.some((m) => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });

        if (messageSenderId === currentChat._id) {
          socket.emit('mark_seen', { receiverId: currentChat._id });
        }
      } else {
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
      fetchConversations();
    };

    const handleEdited = (editedMsg) => {
      setMessages((prev) => prev.map((m) => (m._id === editedMsg._id ? editedMsg : m)));
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
        if (getReceiverId(m) === receiverId) return { ...m, read: true };
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
  }, [socket, currentChat, user, fetchConversations, setMessages, setConversations]);

  return { onlineUsers, typingUsers, setOnlineUsers };
};
