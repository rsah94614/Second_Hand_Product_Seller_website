import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useColorScheme } from "nativewind";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

function SettingRow({
  href,
  title,
  subtitle,
  icon,
  iconColor = "#64748b",
  iconBg = "bg-slate-100 dark:bg-slate-800",
  destructive = false,
  onPress,
  rightContent,
}: {
  href?: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  destructive?: boolean;
  onPress?: () => void;
  rightContent?: React.ReactNode;
}) {
  const content = (
    <View className="flex-row items-center px-5 py-4">
      <View className={`h-9 w-9 rounded-2xl items-center justify-center mr-4 ${iconBg}`}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className={`text-[16px] font-outfit-m ${destructive ? "text-red-500" : "text-slate-800 dark:text-slate-200"}`}>{title}</Text>
        {subtitle ? <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</Text> : null}
      </View>
      {rightContent || <Ionicons name="chevron-forward" size={16} color="#94a3b8" />}
    </View>
  );

  if (href) {
    return (
      <Link href={href as never} asChild>
        <Pressable className="active:bg-slate-50 dark:active:bg-slate-800/50">{content}</Pressable>
      </Link>
    );
  }
  if (onPress) {
    return <Pressable onPress={onPress} className="active:bg-slate-50 dark:active:bg-slate-800/50">{content}</Pressable>;
  }
  return content;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/50 dark:shadow-none divide-y divide-slate-100 dark:divide-slate-800">
      {children}
    </View>
  );
}

export default function ProfileScreen() {
  const { user, loading, logout, updateProfile } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [editLocation, setEditLocation] = useState(user?.location || "");
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: editName.trim(), phone: editPhone.trim(), location: editLocation.trim() });
      setEditMode(false);
    } catch {
      Alert.alert("Error", "Could not update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <Text className="text-[15px] font-outfit-m text-slate-500 dark:text-slate-400">Loading...</Text>
        </View>
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <View className="flex-1 justify-center px-6 py-12">
          <View className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/60 items-center justify-center self-center mb-6">
            <Text className="text-3xl">👤</Text>
          </View>
          <Text className="text-center text-2xl font-outfit-bl text-slate-900 dark:text-white mb-2">Sign In Required</Text>
          <Text className="text-center text-[15px] font-outfit text-slate-500 dark:text-slate-400 mb-8 px-4">
            Sign in to manage your orders, wishlist, and seller dashboard.
          </Text>
          <Button title="Sign In" onPress={() => router.push("/(auth)/login")} className="mb-3" />
          <Button title="Create an Account" variant="outline" onPress={() => router.push("/(auth)/register")} />
        </View>
      </Screen>
    );
  }

  const userInitials = user.name?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "U";

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* ── Avatar & Name ── */}
        <View className="items-center rounded-3xl bg-white dark:bg-slate-900 px-6 py-8 shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 mb-4">
          <View className="h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-900 border-4 border-primary-50 dark:border-primary-950/60 items-center justify-center mb-4">
            <Text className="text-3xl font-outfit-bl text-primary-600 dark:text-primary-400">{userInitials}</Text>
          </View>

          {editMode ? (
            <View className="w-full">
              <TextInput
                value={editName}
                onChangeText={setEditName}
                className="text-center text-[20px] font-outfit-b text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 mb-3"
                placeholder="Your name"
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                value={editPhone}
                onChangeText={setEditPhone}
                className="text-center text-[14px] font-outfit text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3"
                placeholder="Phone number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />
              <TextInput
                value={editLocation}
                onChangeText={setEditLocation}
                className="text-center text-[14px] font-outfit text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4"
                placeholder="Location"
                placeholderTextColor="#94a3b8"
              />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Button title="Cancel" variant="outline" onPress={() => { setEditMode(false); setEditName(user.name || ""); setEditPhone(user.phone || ""); setEditLocation(user.location || ""); }} />
                </View>
                <View className="flex-1">
                  <Button title="Save" onPress={saveProfile} loading={saving} />
                </View>
              </View>
            </View>
          ) : (
            <>
              <Text className="text-[22px] font-outfit-b text-slate-900 dark:text-white leading-tight">{user.name}</Text>
              <Text className="mt-1 text-[14px] font-outfit text-slate-500 dark:text-slate-400">{user.email}</Text>
              {user.phone ? <Text className="mt-0.5 text-[13px] font-outfit text-slate-400 dark:text-slate-500">{user.phone}</Text> : null}
              {user.location ? (
                <View className="flex-row items-center gap-1 mt-1">
                  <Ionicons name="location-outline" size={13} color="#94a3b8" />
                  <Text className="text-[13px] font-outfit text-slate-400 dark:text-slate-500">{user.location}</Text>
                </View>
              ) : null}

              <View className="flex-row gap-2 mt-4 items-center">
                <View className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                  <Text className="text-[11px] font-outfit-sb text-slate-600 dark:text-slate-300 uppercase tracking-widest">{user.role}</Text>
                </View>
                {user.campus?.collegeName ? (
                  <View className="px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/40">
                    <Text className="text-[11px] font-outfit-sb text-primary-600 dark:text-primary-400 uppercase tracking-widest">{user.campus.collegeName}</Text>
                  </View>
                ) : null}
              </View>

              <Pressable
                onPress={() => { setEditName(user.name || ""); setEditPhone(user.phone || ""); setEditLocation(user.location || ""); setEditMode(true); }}
                className="mt-4 flex-row items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 active:bg-slate-200"
              >
                <Ionicons name="create-outline" size={14} color="#64748b" />
                <Text className="text-[13px] font-outfit-sb text-slate-600 dark:text-slate-300">Edit Profile</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* ── Campus Info ── */}
        {user.campus && (user.campus.collegeName || user.campus.department || user.campus.year) && (
          <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none mb-4">
            <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Campus Info</Text>
            {user.campus.collegeName ? (
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="school-outline" size={15} color="#6366f1" />
                <Text className="text-[14px] font-outfit-m text-slate-800 dark:text-slate-200">{user.campus.collegeName}</Text>
              </View>
            ) : null}
            {user.campus.department ? (
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="library-outline" size={15} color="#6366f1" />
                <Text className="text-[14px] font-outfit-m text-slate-800 dark:text-slate-200">{user.campus.department}</Text>
              </View>
            ) : null}
            {user.campus.year ? (
              <View className="flex-row items-center gap-2">
                <Ionicons name="calendar-outline" size={15} color="#6366f1" />
                <Text className="text-[14px] font-outfit-m text-slate-800 dark:text-slate-200">{user.campus.year} Year</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* ── Preferences ── */}
        <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Preferences</Text>
        <SectionCard>
          <SettingRow
            icon={colorScheme === "dark" ? "moon" : "sunny-outline"}
            iconColor={colorScheme === "dark" ? "#818cf8" : "#f59e0b"}
            iconBg={colorScheme === "dark" ? "bg-indigo-100 dark:bg-indigo-900/40" : "bg-amber-50 dark:bg-amber-900/40"}
            title="Theme"
            subtitle={colorScheme === "dark" ? "Dark mode" : "Light mode"}
            onPress={toggleColorScheme}
            rightContent={
              <View className={`w-12 h-6 rounded-full ${colorScheme === "dark" ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-700"} items-center justify-center px-1 flex-row`}>
                <View className={`h-4 w-4 rounded-full bg-white shadow-sm ${colorScheme === "dark" ? "ml-auto" : "mr-auto"}`} />
              </View>
            }
          />
        </SectionCard>

        {/* ── Account ── */}
        <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-5 mb-2 ml-1">Account</Text>
        <SectionCard>
          <SettingRow href="/wishlist" title="My Wishlist" icon="heart-outline" iconColor="#e11d48" iconBg="bg-red-50 dark:bg-red-950/30" />
          <SettingRow href="/notifications" title="Notifications" icon="notifications-outline" iconColor="#6366f1" iconBg="bg-indigo-50 dark:bg-indigo-950/30" />
          {user.role === "user" && (
            <>
              <SettingRow href="/dashboard" title="Seller Dashboard" icon="bar-chart-outline" iconColor="#0891b2" iconBg="bg-cyan-50 dark:bg-cyan-950/30" />
              <SettingRow href="/my-products" title="My Listings" icon="layers-outline" iconColor="#059669" iconBg="bg-emerald-50 dark:bg-emerald-950/30" />
              <SettingRow href="/create-product" title="Create New Listing" icon="add-circle-outline" iconColor="#d97706" iconBg="bg-amber-50 dark:bg-amber-950/30" />
            </>
          )}
          {user.role === "admin" && (
            <SettingRow href="/admin" title="Admin Panel" icon="shield-checkmark-outline" iconColor="#7c3aed" iconBg="bg-violet-50 dark:bg-violet-950/30" />
          )}
        </SectionCard>

        {/* ── Danger Zone ── */}
        <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-5 mb-2 ml-1">Account Actions</Text>
        <SectionCard>
          <SettingRow
            icon="log-out-outline"
            iconColor="#e11d48"
            iconBg="bg-red-50 dark:bg-red-950/30"
            title="Sign Out"
            destructive
            onPress={async () => {
              Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                { text: "Cancel", style: "cancel" },
                { text: "Sign Out", style: "destructive", onPress: async () => { await logout(); router.replace("/" as never); } },
              ]);
            }}
          />
        </SectionCard>

        <View className="h-4" />
      </ScrollView>
    </Screen>
  );
}
