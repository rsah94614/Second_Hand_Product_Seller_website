import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  snoozeNotification,
} from '../api/notificationApi';
import { useAuth } from '../../../context/AuthContext';
import {
  getNotificationDateBucket,
  getNotificationCategory,
} from '../utils/notificationMeta';

export const useNotificationsLogic = () => {
  const { user } = useAuth();
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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications-list', queryArgs],
    queryFn: () => getNotifications(queryArgs),
    enabled: Boolean(user),
    refetchInterval: user ? 15000 : false,
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
      try {
        await markOneMutation.mutateAsync(notification._id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    if (notification.link) navigate(notification.link);
  };

  const handleSnooze = (id, duration) => {
    snoozeMutation.mutate({ id, duration });
  };

  // ── Data Transformation ──────────────────────────────────────────────────
  const notifications = useMemo(() => {
    const raw = data?.notifications || [];
    const seen = new Set();
    return raw.filter((n) => {
      if (!n?._id || seen.has(n._id)) return false;
      seen.add(n._id);
      return true;
    });
  }, [data?.notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => (
      activeCategory === 'all' || getNotificationCategory(notification.type) === activeCategory
    ));
  }, [notifications, activeCategory]);

  const groupedEntries = useMemo(() => {
    const grouped = filteredNotifications.reduce((acc, notification) => {
      const bucket = getNotificationDateBucket(notification.createdAt);
      if (!acc[bucket]) acc[bucket] = [];
      acc[bucket].push(notification);
      return acc;
    }, {});

    return ['Today', 'Yesterday', 'Earlier This Week', 'Earlier This Month', 'Older']
      .filter((label) => grouped[label]?.length)
      .map((label) => ({
        label,
        items: grouped[label],
      }));
  }, [filteredNotifications]);

  const categoryCounts = useMemo(() => {
    return notifications.reduce((acc, notification) => {
      const category = getNotificationCategory(notification.type);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  }, [notifications]);

  return {
    activeTab,
    setActiveTab,
    activeCategory,
    setActiveCategory,
    isLoading,
    unreadCount: data?.unreadCount || 0,
    totalCount: notifications.length,
    groupedEntries,
    categoryCounts,
    handleOpenNotification,
    handleSnooze,
    markAllRead: markAllMutation.mutate,
    isMarkAllPending: markAllMutation.isPending,
    refetch,
  };
};
