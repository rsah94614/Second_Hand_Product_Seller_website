import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Bell, Mail, MessageSquare, ShoppingBag, Tag, Megaphone, ShieldAlert, BookOpen } from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { getNotificationPreferences, updateNotificationPreferences } from '../api/notificationApi';

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
      checked ? 'bg-primary-600' : 'bg-gray-200'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

const PreferenceRow = ({ icon: Icon, label, description, value, onChange, disabled }) => (
  <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary-600" />
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
    <Toggle checked={!!value} onChange={onChange} disabled={disabled} />
  </div>
);

const NotificationPreferencesPage = () => {
  const queryClient = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getNotificationPreferences,
  });

  const mutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      toast.success('Preferences saved');
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: () => toast.error('Failed to save preferences'),
  });

  const update = (key, value) => {
    mutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Bell className="w-7 h-7 text-primary-600" />
            Notification Preferences
          </h1>
          <p className="text-gray-500 mt-2">Control how and when you receive notifications.</p>
        </div>

        <div className="space-y-6">
          {/* Channels */}
          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Delivery Channels</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent>
              <PreferenceRow
                icon={Mail}
                label="Email Notifications"
                description="Receive notifications via email"
                value={prefs?.emailNotifications}
                onChange={(v) => update('emailNotifications', v)}
                disabled={mutation.isPending}
              />
              <PreferenceRow
                icon={MessageSquare}
                label="Push Notifications"
                description="In-app push notifications"
                value={prefs?.pushNotifications}
                onChange={(v) => update('pushNotifications', v)}
                disabled={mutation.isPending}
              />
            </CardContent>
          </Card>

          {/* Categories */}
          <Card className="rounded-2xl border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Notification Categories</CardTitle>
              <CardDescription>Choose which types of notifications you receive</CardDescription>
            </CardHeader>
            <CardContent>
              <PreferenceRow
                icon={ShoppingBag}
                label="Order Updates"
                description="Order status changes, meetup reminders"
                value={prefs?.orderUpdates}
                onChange={(v) => update('orderUpdates', v)}
                disabled={mutation.isPending}
              />
              <PreferenceRow
                icon={MessageSquare}
                label="Chat Messages"
                description="New messages from other users"
                value={prefs?.chatMessages}
                onChange={(v) => update('chatMessages', v)}
                disabled={mutation.isPending}
              />
              <PreferenceRow
                icon={Tag}
                label="Product Updates"
                description="Price drops and availability changes on saved items"
                value={prefs?.productUpdates}
                onChange={(v) => update('productUpdates', v)}
                disabled={mutation.isPending}
              />
              <PreferenceRow
                icon={Megaphone}
                label="Promotions"
                description="Platform announcements and offers"
                value={prefs?.promotions}
                onChange={(v) => update('promotions', v)}
                disabled={mutation.isPending}
              />
              <PreferenceRow
                icon={BookOpen}
                label="Weekly Digest"
                description="Weekly summary of activity"
                value={prefs?.weeklyDigest}
                onChange={(v) => update('weeklyDigest', v)}
                disabled={mutation.isPending}
              />
              <PreferenceRow
                icon={ShieldAlert}
                label="Admin Alerts"
                description="Moderation and account alerts"
                value={prefs?.adminAlerts}
                onChange={(v) => update('adminAlerts', v)}
                disabled={mutation.isPending}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotificationPreferencesPage;
