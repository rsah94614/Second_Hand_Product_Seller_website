import React from 'react';
import { Bell, CheckCheck } from 'lucide-react';

export const NotificationEmptyState = ({ type = 'all', category = 'all' }) => {
  if (type === 'unread') {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center animate-fade-in">
        <div className="mx-auto h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
          <CheckCheck className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">All caught up</h2>
        <p className="mt-2 text-gray-500 max-w-sm mx-auto">
          You have no unread notifications right now. Great job staying organized!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center animate-fade-in">
      <div className="mx-auto h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
        <Bell className="h-10 w-10 text-gray-300" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">
        {category === 'all' ? 'No notifications yet' : `No ${category} notifications`}
      </h2>
      <p className="mt-2 text-gray-500 max-w-sm mx-auto">
        When orders, chats, reviews, and moderation events happen, they&apos;ll appear here to keep you updated.
      </p>
    </div>
  );
};
