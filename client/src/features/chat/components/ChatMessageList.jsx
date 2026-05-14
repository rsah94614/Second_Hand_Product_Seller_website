import React from 'react';
import { MessageSquare } from 'lucide-react';
import ChatMessageItem from './ChatMessageItem';

export default function ChatMessageList({
  messages,
  user,
  loadingMore,
  handleScroll,
  scrollRef,
  handleEditInit,
  handleDelete,
  setViewerUri,
  setViewerVisible
}) {
  // Helper functions
  const getSenderId = (msg) => (typeof msg.sender === 'object' ? msg.sender?._id : msg.sender);
  
  const getDateLabel = (message, index) => {
    if (index === 0) return new Date(message.timestamp).toLocaleDateString();
    const prevMessage = messages[index - 1];
    const currentDate = new Date(message.timestamp).setHours(0, 0, 0, 0);
    const prevDate = new Date(prevMessage.timestamp).setHours(0, 0, 0, 0);
    if (currentDate !== prevDate) {
      return new Date(message.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    }
    return null;
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-4 md:p-6 space-y-1 bg-slate-50 scroll-smooth"
      onScroll={handleScroll}
    >
      {loadingMore && (
        <div className="flex justify-center py-2">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
          <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-primary-200" />
          </div>
          <p className="font-semibold text-gray-600">No messages yet</p>
          <p className="text-xs mt-1 text-gray-500">Say hi to start the conversation! 👋</p>
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
              <ChatMessageItem
                message={message}
                isMe={isMe}
                isTemp={isTemp}
                handleEditInit={handleEditInit}
                handleDelete={handleDelete}
                setViewerUri={setViewerUri}
                setViewerVisible={setViewerVisible}
              />
            </div>
          </React.Fragment>
        );
      })}
      <div ref={scrollRef} />
    </div>
  );
}
