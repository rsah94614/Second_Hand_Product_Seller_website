import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  SlidersHorizontal,
  Clock,
} from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  snoozeNotification,
} from '../api/notificationApi';
import {
  formatNotificationTime,
  getNotificationDateBucket,
  getNotificationCategory,
  getNotificationVisual,
  notificationCategoryOptions,
} from '../utils/notificationMeta';

const NotificationRow = ({ notification, onOpen, onSnooze }) => {
  const visual = getNotificationVisual(notification.type);
  const Icon = visual.icon;

  return (
    <div className={`w-full rounded-2xl border p-4 transition-all hover:border-primary-200 hover:bg-primary-50/40 ${
      notification.isRead ? 'border-gray-100 bg-white' : 'border-primary-100 bg-primary-50/30'
    }`}>
      <div className="flex items-start gap-4">
        <button type="button" onClick={() => onOpen(notification)} className="flex-1 text-left">
          <div className="flex items-start gap-4">
            <div className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${visual.iconTone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-gray-900">{notification.title}</p>
                {!notification.isRead && <Badge variant="default">New</Badge>}
                <Badge variant={visual.badge}>{notification.type.replace(/_/g, ' ')}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">{notification.message}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-gray-400">
                  {formatNotificationTime(notification.createdAt, true)}
                </span>
                {notification.link && (
                  <span className="text-xs font-semibold text-primary-600">Open</span>
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
          <div className="absolute right-0 top-8 hidden group-hover:flex flex-col bg-white border border-gray-100 rounded-xl shadow-lg z-10 min-w-[120px]">
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

const NotificationGroup = ({ title, items, onOpen, onSnooze }) => (
  <section>
    <div className="mb-3 flex items-center gap-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">{title}</h3>
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

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const queryArgs = useMemo(
    () => ({
      page: 1,
      limit: 50,
      unread: activeTab === 'unread',
    }),
    [activeTab]
  );

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-list', queryArgs],
    queryFn: () => getNotifications(queryArgs),
    refetchInterval: 15000,
  });

  const markOneMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: ({ id, duration }) => snoozeNotification(id, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  const handleOpenNotification = async (notification) => {
    if (!notification.isRead) {
      await markOneMutation.mutateAsync(notification._id);
    }
    if (notification.link) navigate(notification.link);
  };

  const handleSnooze = (id, duration) => {
    snoozeMutation.mutate({ id, duration });
  };

  const rawNotifications = data?.notifications || [];
  const notifications = useMemo(() => {
    const seen = new Set();
    return rawNotifications.filter((n) => {
      if (!n?._id || seen.has(n._id)) return false;
      seen.add(n._id);
      return true;
    });
  }, [rawNotifications]);
  const filteredNotifications = notifications.filter((notification) => (
    activeCategory === 'all' || getNotificationCategory(notification.type) === activeCategory
  ));

  const groupedNotifications = filteredNotifications.reduce((acc, notification) => {
    const bucket = getNotificationDateBucket(notification.createdAt);
    if (!acc[bucket]) {
      acc[bucket] = [];
    }
    acc[bucket].push(notification);
    return acc;
  }, {});

  const groupedEntries = ['Today', 'Yesterday', 'Earlier This Week', 'Earlier This Month', 'Older']
    .filter((label) => groupedNotifications[label]?.length)
    .map((label) => ({
      label,
      items: groupedNotifications[label],
    }));

  const categoryCounts = notifications.reduce((acc, notification) => {
    const category = getNotificationCategory(notification.type);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader className="flex flex-col gap-5 border-b border-gray-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-3xl">
                <Bell className="h-7 w-7 text-primary-600" />
                Notifications
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-base">
                Stay on top of orders, chats, saved-item changes, reviews, and moderation updates from one place.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={data?.unreadCount ? 'default' : 'secondary'}>
                {data?.unreadCount || 0} unread
              </Badge>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => markAllMutation.mutate()}
                disabled={!data?.unreadCount || markAllMutation.isPending}
              >
                <CheckCheck className="h-4 w-4" />
                Mark All Read
              </Button>
              <Link to="/notifications/preferences">
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Preferences
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
              </TabsList>
              <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <SlidersHorizontal className="h-4 w-4 text-primary-600" />
                  Category Filters
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {notificationCategoryOptions.map((category) => {
                    const isActive = activeCategory === category.value;
                    const count = category.value === 'all'
                      ? notifications.length
                      : (categoryCounts[category.value] || 0);

                    return (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => setActiveCategory(category.value)}
                        className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                          isActive
                            ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:text-primary-700'
                        }`}
                      >
                        <span>{category.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <TabsContent value="all" className="mt-0">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, index) => (
                      <div key={index} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
                    ))}
                  </div>
                ) : filteredNotifications.length ? (
                  <div className="space-y-8">
                    {groupedEntries.map((group) => (
                      <NotificationGroup
                        key={group.label}
                        title={group.label}
                        items={group.items}
                        onOpen={handleOpenNotification}
                        onSnooze={handleSnooze}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
                    <Bell className="mx-auto h-10 w-10 text-gray-300" />
                    <h2 className="mt-4 text-xl font-semibold text-gray-900">
                      {activeCategory === 'all' ? 'No notifications yet' : `No ${activeCategory} notifications`}
                    </h2>
                    <p className="mt-2 text-gray-500">
                      When orders, chats, reviews, and moderation events happen, they&apos;ll appear here.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="unread" className="mt-0">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
                    ))}
                  </div>
                ) : filteredNotifications.length ? (
                  <div className="space-y-8">
                    {groupedEntries.map((group) => (
                      <NotificationGroup
                        key={group.label}
                        title={group.label}
                        items={group.items}
                        onOpen={handleOpenNotification}
                        onSnooze={handleSnooze}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
                    <CheckCheck className="mx-auto h-10 w-10 text-emerald-400" />
                    <h2 className="mt-4 text-xl font-semibold text-gray-900">All caught up</h2>
                    <p className="mt-2 text-gray-500">You have no unread notifications right now.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default NotificationsPage;
