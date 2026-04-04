import {
  Bell,
  Flag,
  Heart,
  MessageCircle,
  ShieldAlert,
  ShoppingBag,
  Star,
} from 'lucide-react';

export const formatNotificationTime = (value, withAgo = false) => {
  const timestamp = new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m${withAgo ? ' ago' : ''}`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h${withAgo ? ' ago' : ''}`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d${withAgo ? ' ago' : ''}`;

  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: withAgo ? 'numeric' : undefined,
  });
};

export const getNotificationDateBucket = (value) => {
  const target = new Date(value);
  const now = new Date();

  const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((currentDate - targetDate) / 86400000);

  if (diffDays <= 0) {
    return 'Today';
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return 'Earlier This Week';
  }

  if (diffDays < 30) {
    return 'Earlier This Month';
  }

  return 'Older';
};

export const getNotificationCategory = (type = '') => {
  if (type.includes('message')) return 'messages';
  if (type.includes('order')) return 'orders';
  if (type.includes('review')) return 'reviews';
  if (type.includes('report')) return 'moderation';
  if (type.includes('wishlist')) return 'wishlist';
  if (type.includes('listing')) return 'listing';
  return 'general';
};

export const notificationCategoryOptions = [
  { value: 'all', label: 'All' },
  { value: 'messages', label: 'Messages' },
  { value: 'orders', label: 'Orders' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'moderation', label: 'Moderation' },
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'listing', label: 'Listings' },
];

export const getNotificationVisual = (type = '') => {
  const category = getNotificationCategory(type);

  switch (category) {
    case 'messages':
      return {
        icon: MessageCircle,
        badge: 'secondary',
        iconTone: 'bg-sky-50 text-sky-600',
        categoryLabel: 'Messages',
      };
    case 'orders':
      return {
        icon: ShoppingBag,
        badge: 'outline',
        iconTone: 'bg-amber-50 text-amber-700',
        categoryLabel: 'Orders',
      };
    case 'reviews':
      return {
        icon: Star,
        badge: 'success',
        iconTone: 'bg-emerald-50 text-emerald-600',
        categoryLabel: 'Reviews',
      };
    case 'moderation':
      return {
        icon: Flag,
        badge: 'destructive',
        iconTone: 'bg-rose-50 text-rose-600',
        categoryLabel: 'Moderation',
      };
    case 'wishlist':
      return {
        icon: Heart,
        badge: 'secondary',
        iconTone: 'bg-pink-50 text-pink-600',
        categoryLabel: 'Wishlist',
      };
    case 'listing':
      return {
        icon: ShieldAlert,
        badge: 'outline',
        iconTone: 'bg-violet-50 text-violet-600',
        categoryLabel: 'Listings',
      };
    default:
      return {
        icon: Bell,
        badge: 'outline',
        iconTone: 'bg-gray-100 text-gray-600',
        categoryLabel: 'General',
      };
  }
};
