import React from 'react';
import { MessageSquare, Search, X, Pin } from 'lucide-react';

export default function ChatSidebar({
  conversations,
  loadingConversations,
  currentChat,
  showMobileChat,
  onlineUsers,
  conversationSearch,
  setConversationSearch,
  handleChatSelect
}) {
  const filteredConversations = conversations.filter((c) => {
    const q = conversationSearch.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q);
  });

  return (
    <div className={`border-r border-gray-100 flex flex-col h-full bg-gray-50/30 overflow-hidden ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-4 border-b border-gray-100 bg-white flex-none">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-3">
          <MessageSquare className="w-6 h-6 text-primary-600" />
          Messages
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={conversationSearch}
            onChange={(e) => setConversationSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-300 focus:bg-white transition-colors"
          />
          {conversationSearch && (
            <button onClick={() => setConversationSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200">
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {loadingConversations ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-3 flex items-center gap-3 animate-pulse border-b border-gray-50 last:border-0">
              <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0"></div>
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-10"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))
        ) : filteredConversations.map((conversation) => (
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
        {!loadingConversations && filteredConversations.length === 0 && (
          <div className="text-center py-10 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Search className="w-8 h-8" />
            </div>
            <p className="text-gray-500 font-medium">
              {conversationSearch ? 'No matching conversations' : 'No conversations yet'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {conversationSearch ? "We couldn't find any matches." : 'Start chatting with other users!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
