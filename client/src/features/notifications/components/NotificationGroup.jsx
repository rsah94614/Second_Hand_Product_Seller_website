import React from 'react';
import { NotificationRow } from './NotificationRow';

export const NotificationGroup = ({ title, items, onOpen, onSnooze }) => (
  <section className="animate-fade-up">
    <div className="mb-4 flex items-center gap-3">
      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">{title}</h3>
      <div className="h-px flex-1 bg-gray-100" />
    </div>
    <div className="space-y-4">
      {items.map((notification) => (
        <NotificationRow
          key={notification._id}
          notification={notification}
          onOpen={onOpen}
          onSnooze={onSnooze}
        />
      ))}
    </div>
  </section>
);
