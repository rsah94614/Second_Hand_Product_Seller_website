import React from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen } from "../../components/ui/Screen";
import { useAuth } from "../../context/AuthContext";
import { useAppTheme, ThemeType } from "../../context/ThemeContext";

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  iconColor?: string;
  iconBg?: string;
  danger?: boolean;
};

const SettingRow = ({
  icon,
  title,
  subtitle,
  onPress,
  iconColor = "#64748b",
  iconBg = "bg-slate-100 dark:bg-slate-800",
  danger,
}: SettingRowProps) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800/50 active:bg-slate-50 dark:active:bg-slate-800"
  >
    <View className="flex-row items-center gap-4 flex-1">
      <View className={`w-9 h-9 rounded-xl items-center justify-center ${iconBg}`}>
        <Ionicons name={icon} size={18} color={danger ? "#ef4444" : iconColor} />
      </View>
      <View className="flex-1">
        <Text className={`text-[15px] font-outfit-m ${danger ? "text-red-500" : "text-slate-900 dark:text-white"}`}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-[13px] font-outfit text-slate-500 mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
    </View>
    <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
  </Pressable>
);

const SettingGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View className="mb-6">
    <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest px-4 mb-2 ml-1">
      {title}
    </Text>
    <View className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
      {children}
    </View>
  </View>
);

export default function SettingsScreen() {
  const { user } = useAuth();
  const { theme, setTheme } = useAppTheme();

  const themeLabels: Record<ThemeType, string> = {
    system: "System Default",
    light: "Light Mode",
    dark: "Dark Mode",
  };

  const handleThemePress = () => {
    Alert.alert("Choose Theme", "Select your preferred appearance", [
      { text: "System Default", onPress: () => setTheme("system") },
      { text: "Light Mode", onPress: () => setTheme("light") },
      { text: "Dark Mode", onPress: () => setTheme("dark") },
      { text: "Cancel", style: "cancel" },
    ], { cancelable: true });
  };

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950" safeAreaTop={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <SettingGroup title="Account & Security">
          <SettingRow
            icon="key-outline"
            title="Change Password"
            onPress={() => router.push("/(auth)/forgot-password")}
            iconColor="#6366f1"
            iconBg="bg-indigo-50 dark:bg-indigo-900/30"
          />
          <SettingRow
            icon="phone-portrait-outline"
            title="Active Devices"
            subtitle="Manage your signed-in sessions"
            onPress={() => router.push("/devices")}
            iconColor="#7c3aed"
            iconBg="bg-violet-50 dark:bg-violet-900/30"
          />
          <SettingRow
            icon="trash-outline"
            title="Delete Account"
            onPress={() => router.push("/delete-account")}
            danger
            iconColor="#ef4444"
            iconBg="bg-red-50 dark:bg-red-900/30"
          />
        </SettingGroup>

        <SettingGroup title="App Preferences">
          <SettingRow
            icon="color-palette-outline"
            title="Theme"
            subtitle={themeLabels[theme]}
            onPress={handleThemePress}
            iconColor="#0891b2"
            iconBg="bg-cyan-50 dark:bg-cyan-900/30"
          />
        </SettingGroup>

        <SettingGroup title="Privacy & Notifications">
          <SettingRow
            icon="notifications-outline"
            title="Notification Preferences"
            subtitle="Control what alerts you receive"
            onPress={() => router.push("/notification-preferences")}
            iconColor="#f59e0b"
            iconBg="bg-amber-50 dark:bg-amber-900/30"
          />
          <SettingRow
            icon="shield-half-outline"
            title="Blocked Users"
            onPress={() => router.push("/blocked-users")}
            iconColor="#10b981"
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          />
        </SettingGroup>

        <SettingGroup title="Support & Legal">
          <SettingRow
            icon="help-buoy-outline"
            title="Help Center"
            onPress={() => router.push("/help-center")}
            iconColor="#3b82f6"
            iconBg="bg-blue-50 dark:bg-blue-900/30"
          />
          <SettingRow
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => router.push("/terms-of-service")}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            onPress={() => router.push("/privacy-policy")}
          />
        </SettingGroup>

        <Text className="text-center text-[12px] font-outfit text-slate-400 mt-4">
          Campus Mitra v1.0.0
        </Text>
      </ScrollView>
    </Screen>
  );
}
