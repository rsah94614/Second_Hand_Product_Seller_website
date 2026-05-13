import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { formatNotificationTime, getNotificationVisual } from '../utils/notificationMeta';

export const NotificationRow = ({ notification, onOpen, onSnooze }) => {
  const visual = getNotificationVisual(notification.type);
  const Icon = visual.icon;

  return (
    <div className={`w-full rounded-2xl border p-4 transition-all hover:border-primary-200 hover:bg-primary-50/40 ${
      notification.isRead ? 'border-gray-100 bg-white' : 'border-primary-100 bg-primary-50/30 shadow-sm shadow-primary-100/20'
    }`}>
      <div className="flex items-start gap-4">
        <button type="button" onClick={() => onOpen(notification)} className="flex-1 text-left group/content">
          <div className="flex items-start gap-4">
            <div className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${visual.iconTone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={`font-semibold text-gray-900 ${!notification.isRead ? 'text-primary-900' : ''}`}>
                  {notification.title}
                </p>
                {!notification.isRead && <Badge variant="default" className="bg-primary-600">New</Badge>}
                <Badge variant={visual.badge} className="capitalize">
                  {notification.type.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">{notification.message}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-gray-400">
                  {formatNotificationTime(notification.createdAt, true)}
                </span>
                {notification.link && (
                  <span className="text-xs font-bold text-primary-600 opacity-0 group-hover/content:opacity-100 transition-opacity">
                    Open Details
                  </span>
                )}
              </div>
            </div>
          </div>
        </button>

        {/* Snooze button */}
        <div className="relative group shrink-0">
          <button
            type="button"
            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
            title="Snooze"
          >
            <Clock className="h-4 w-4" />
          </button>
          <div className="absolute right-0 top-8 hidden group-hover:flex flex-col bg-white border border-gray-100 rounded-xl shadow-xl z-20 min-w-[120px] animate-in fade-in zoom-in duration-150">
            {['1h', '1d', '1w'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onSnooze(notification._id, d)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left first:rounded-t-xl last:rounded-b-xl"
              >
                {d === '1h' ? '1 hour' : d === '1d' ? '1 day' : '1 week'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
