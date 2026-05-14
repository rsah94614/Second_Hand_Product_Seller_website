import React from 'react';
import { Send, Image, Search, X, Edit2 } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const QUICK_TEMPLATES = [
  "Hi, is this available?",
  "What's your best price?",
  "Can you deliver this?",
  "When can I pick this up?",
  "Are there any defects?"
];

export default function ChatInput({
  newMessage,
  setNewMessage,
  editingMessageId,
  cancelEdit,
  sendMessage,
  handleInputChange,
  handleImageSend,
  handleMessageSearch,
  messageSearch,
  searchResults,
  inputRef,
  messagesCount
}) {


  return (
    <div className="p-3 md:p-4 border-t border-gray-100 bg-white flex-none">
      {/* Message search */}
      <div className="mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={messageSearch}
            onChange={handleMessageSearch}
            placeholder="Search messages…"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-300"
          />
        </div>
        {searchResults !== null && (
          <div className="mt-1 max-h-32 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-sm text-xs">
            {searchResults.length === 0 ? (
              <p className="p-2 text-gray-400 text-center">No messages found</p>
            ) : searchResults.map((m) => (
              <div key={m._id} className="px-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-500">{new Date(m.timestamp).toLocaleDateString()}: </span>
                <span className="text-gray-700">{m.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingMessageId && (
        <div className="flex items-center justify-between bg-primary-50 text-primary-700 text-xs px-4 py-2 mb-2 rounded-xl border border-primary-100">
          <span className="flex items-center gap-2 font-medium"><Edit2 className="w-3.5 h-3.5" /> Editing message… <span className="text-primary-400">(Esc to cancel)</span></span>
          <button onClick={cancelEdit} className="p-1 hover:bg-primary-100 rounded-full transition-colors"><X className="w-4 h-4" /></button>
        </div>
      )}
      {messagesCount < 5 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-2">
          {QUICK_TEMPLATES.map((template, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setNewMessage(template)}
              className="shrink-0 bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs px-3 py-1.5 rounded-full border border-primary-100 transition-colors whitespace-nowrap"
            >
              {template}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={sendMessage} className="flex gap-2 md:gap-3 items-end max-w-4xl mx-auto">
        {/* Image upload */}
        <label className="shrink-0 cursor-pointer p-2 rounded-xl hover:bg-gray-100 transition-colors" title="Send image">
          <Image className="w-5 h-5 text-gray-400" />
          <input type="file" accept="image/*" className="hidden" onChange={handleImageSend} />
        </label>
        <Input
          ref={inputRef}
          value={newMessage}
          onChange={handleInputChange}
          placeholder={editingMessageId ? 'Edit your message...' : 'Type a message'}
          className={`flex-1 bg-gray-50 focus:bg-white transition-all rounded-2xl px-4 py-3 shadow-inner ${editingMessageId ? 'border-primary-200' : 'border-gray-200'}`}
        />
        <Button
          type="submit"
          className="rounded-xl w-12 h-12 shrink-0 p-0 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 bg-primary-600 hover:bg-primary-700"
          disabled={!newMessage.trim()}
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}
