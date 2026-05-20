import React from 'react';
import { ArrowLeft, ShieldAlert, Pin, PinOff, Ban, User } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function ChatHeader({
  currentChat,
  onlineUsers,
  isOtherUserTyping,
  handleBackToConversations,
  handleTogglePin,
  handleReport,
  handleBlock,
  pinMutationPending,
  reportMutationPending,
  blockMutationPending
}) {
  const navigate = useNavigate();
  const handleViewProfile = () => {
    if (currentChat?._id) navigate(`/users/${currentChat._id}`);
  };
  return (
    <div className="p-3 md:p-4 border-b border-gray-100 flex items-center bg-white shadow-sm z-10 flex-none">
      {/* Mobile back button — sits outside the profile link */}
      <button
        onClick={handleBackToConversations}
        className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors mr-1 shrink-0"
        aria-label="Back to conversations"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700" />
      </button>

      {/* Clickable profile area */}
      <button
        onClick={handleViewProfile}
        className="flex items-center gap-3 hover:bg-gray-50 rounded-2xl px-2 py-1.5 transition-colors group cursor-pointer"
        title={`View ${currentChat.name}'s profile`}
      >
        <div className="relative">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-primary-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] group-hover:shadow-md transition-shadow">
            {currentChat.name ? currentChat.name[0].toUpperCase() : '?'}
          </div>
          {onlineUsers[currentChat._id] && (
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full z-10 shadow-sm" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-gray-800 text-base md:text-lg group-hover:text-primary-600 transition-colors">{currentChat.name}</h3>
            <User className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-500 transition-colors" />
          </div>
          <p className="text-xs md:text-sm text-gray-500 font-medium">
            {isOtherUserTyping ? (
              <span className="text-primary-500 animate-pulse font-semibold">typing...</span>
            ) : onlineUsers[currentChat._id] ? (
              <span className="text-emerald-500 font-semibold">online</span>
            ) : (
              'offline'
            )}
          </p>
        </div>
      </button>

      <div className="ml-auto flex items-center gap-1 md:gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleTogglePin(currentChat)}
          disabled={pinMutationPending}
          className={`hover:bg-gray-50 border-transparent ${currentChat.isPinned ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          title={currentChat.isPinned ? "Unpin Chat" : "Pin Chat"}
        >
          {currentChat.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          <span className="hidden sm:inline ml-2">{currentChat.isPinned ? 'Unpin' : 'Pin'}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReport}
          disabled={reportMutationPending}
          className="text-amber-600 hover:bg-amber-50 hover:border-amber-200 border-transparent"
          title="Report User"
        >
          <ShieldAlert className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">Report</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBlock}
          disabled={blockMutationPending}
          className="text-red-600 hover:bg-red-50 hover:border-red-200 border-transparent"
          title="Block User"
        >
          <Ban className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">Block</span>
        </Button>
      </div>
    </div>
  );
}
