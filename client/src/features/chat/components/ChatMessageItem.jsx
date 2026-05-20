import React from 'react';
import { Edit2, Trash2, Check, CheckCheck, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/DropdownMenu';

export default function ChatMessageItem({
  message,
  isMe,
  isTemp,
  handleEditInit,
  handleDelete,
  setViewerUri,
  setViewerVisible
}) {
  return (
    <div className={`max-w-[85%] md:max-w-[70%] min-w-0 relative ${isMe ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
      {/* Action buttons — positioned above the bubble */}
      {isMe && !message.isDeleted && !isTemp && (
        <div className="absolute -top-4 -right-2 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 text-gray-500 bg-white hover:bg-gray-50 border border-gray-100 shadow-sm rounded-full transition-colors focus:outline-none">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 bg-white rounded-xl shadow-lg border border-gray-100 p-1 z-50">
              <DropdownMenuItem
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => handleEditInit(message)}
              >
                <Edit2 className="w-4 h-4 text-primary-500" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                onClick={() => handleDelete(message._id)}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className={`px-3 py-2 text-sm leading-relaxed relative flex flex-col min-w-20 w-full overflow-hidden ${message.isDeleted
        ? 'bg-gray-100 text-gray-400 italic rounded-2xl shadow-sm border border-gray-200'
        : isMe
          ? 'bg-linear-to-br from-primary-500 to-indigo-600 text-white shadow-md shadow-primary-500/20 rounded-2xl rounded-tr-sm'
          : 'bg-white text-gray-800 shadow-sm shadow-gray-200/50 rounded-2xl rounded-tl-sm border border-gray-100/50'
        }`}>
        {message.isDeleted ? (
          <span className="flex items-center gap-1">🚫 This message was deleted.</span>
        ) : (
          <>
            {message.image && (
              <div
                className="mb-2 overflow-hidden rounded-xl bg-gray-100/50 cursor-zoom-in w-full"
                onClick={() => {
                  setViewerUri(message.image);
                  setViewerVisible(true);
                }}
              >
                <img
                  src={message.image}
                  alt="Chat attachment"
                  className="w-full max-h-[300px] rounded-xl object-contain shadow-sm transition-transform hover:scale-[1.02] block"
                />
              </div>
            )}
            {message.content && (
              <div className="wrap-break-words whitespace-pre-wrap overflow-hidden min-w-0 mb-0.5">{message.content}</div>
            )}
            <div className={`flex items-center justify-end flex-wrap gap-1 text-[10px] self-end mt-0.5 ${isMe ? 'text-white/80' : 'text-gray-400'}`}>
              {message.isEdited && <span>(edited)</span>}
              <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {isMe && !isTemp && (
                message.read ? (
                  <div className="flex items-center gap-0.5">
                    <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
                    <span className="text-blue-300">Read</span>
                  </div>
                ) : message.delivered ? (
                  <div className="flex items-center gap-0.5">
                    <CheckCheck className="w-3.5 h-3.5 opacity-70" />
                    <span className="opacity-70">Delivered</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5">
                    <Check className="w-3 h-3 opacity-70" />
                    <span className="opacity-70">Sent</span>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
