import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Screen } from "../components/ui/Screen";
import { Loading } from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../lib/api/notifications";
import { Ionicons } from "@expo/vector-icons";
import { parseApiError, formatErrorForDisplay } from "../lib/utils/errorHandler";
import { useToast } from "../components/ui/AppToast";

type PrefKey =
  | "emailNotifications"
  | "smsNotifications"
  | "pushNotifications"
  | "orderUpdates"
  | "chatMessages"
  | "productUpdates"
  | "promotions"
  | "weeklyDigest"
  | "adminAlerts";

const CHANNELS: { key: PrefKey; label: string; description: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: "emailNotifications", label: "Email", description: "Receive notifications via email", icon: "mail-outline", color: "#6366f1" },
  { key: "pushNotifications", label: "Push", description: "In-app push notifications", icon: "notifications-outline", color: "#0891b2" },
];

const CATEGORIES: { key: PrefKey; label: string; description: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: "orderUpdates", label: "Order Updates", description: "Status changes, meetup reminders", icon: "cart-outline", color: "#059669" },
  { key: "chatMessages", label: "Chat Messages", description: "New messages from other users", icon: "chatbubble-ellipses-outline", color: "#6366f1" },
  { key: "productUpdates", label: "Product Updates", description: "Price drops on saved items", icon: "pricetag-outline", color: "#d97706" },
  { key: "promotions", label: "Promotions", description: "Platform announcements", icon: "megaphone-outline", color: "#e11d48" },
  { key: "weeklyDigest", label: "Weekly Digest", description: "Weekly activity summary", icon: "newspaper-outline", color: "#7c3aed" },
  { key: "adminAlerts", label: "Admin Alerts", description: "Moderation and account alerts", icon: "shield-checkmark-outline", color: "#0891b2" },
];

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={() => !disabled && onChange(!value)}
      className={`w-12 h-6 rounded-full items-center justify-center px-0.5 flex-row ${value ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-700"} ${disabled ? "opacity-50" : ""}`}
    >
      <View className={`h-5 w-5 rounded-full bg-white shadow-sm ${value ? "ml-auto" : "mr-auto"}`} />
    </Pressable>
  );
}

export default function NotificationPreferencesScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: getNotificationPreferences,
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: (payload: Record<string, boolean>) => updateNotificationPreferences(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      showToast("Notification preferences saved.", { duration: 1800 });
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Failed to save preferences.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  const update = (key: PrefKey, value: boolean) => {
    mutation.mutate({ [key]: value });
  };

  if (!user) return <Redirect href="/(auth)/login" />;

  if (isLoading) {
    return <Screen safeAreaTop={false}><Loading /></Screen>;
  }

  const p = prefs as Record<string, boolean> | undefined;

  return (
    <Screen safeAreaTop={false} className="bg-slate-50 dark:bg-slate-950">
      <ScrollView className="flex-1 px-4 pt-4 pb-10" showsVerticalScrollIndicator={false}>
        <Text className="text-[13px] font-outfit-m text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Settings</Text>
        <Text className="text-[24px] font-outfit-bl text-slate-900 dark:text-white mb-6">Notification Preferences</Text>

        {/* Channels */}
        <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Delivery Channels</Text>
        <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm shadow-slate-200/50 dark:shadow-none mb-6">
          {CHANNELS.map((item, idx) => (
            <View
              key={item.key}
              className={`flex-row items-center px-5 py-4 ${idx < CHANNELS.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""}`}
            >
              <View className="h-9 w-9 rounded-2xl items-center justify-center mr-4 bg-slate-100 dark:bg-slate-800">
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <View className="flex-1">
                <Text className="text-[16px] font-outfit-m text-slate-800 dark:text-slate-200">{item.label}</Text>
                <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</Text>
              </View>
              <Toggle
                value={Boolean(p?.[item.key])}
                onChange={(v) => update(item.key, v)}
                disabled={mutation.isPending}
              />
            </View>
          ))}
        </View>

        {/* Categories */}
        <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Notification Types</Text>
        <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm shadow-slate-200/50 dark:shadow-none mb-6">
          {CATEGORIES.map((item, idx) => (
            <View
              key={item.key}
              className={`flex-row items-center px-5 py-4 ${idx < CATEGORIES.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""}`}
            >
              <View className="h-9 w-9 rounded-2xl items-center justify-center mr-4 bg-slate-100 dark:bg-slate-800">
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <View className="flex-1">
                <Text className="text-[16px] font-outfit-m text-slate-800 dark:text-slate-200">{item.label}</Text>
                <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</Text>
              </View>
              <Toggle
                value={Boolean(p?.[item.key])}
                onChange={(v) => update(item.key, v)}
                disabled={mutation.isPending}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
