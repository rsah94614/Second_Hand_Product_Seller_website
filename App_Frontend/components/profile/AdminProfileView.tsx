import React from "react";
import { View, Text, Pressable, TextInput, ScrollView, Modal, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Button } from "../ui/Button";
import { SectionCard } from "../ui/SectionCard";
import { SettingRow } from "../ui/SettingRow";
import { PROFILE_FIELD_LABELS } from "../../lib/constants/profileForm";
import { parseApiError, formatErrorForDisplay } from "../../lib/utils/errorHandler";

interface AdminProfileViewProps {
  user: any;
  editMode: boolean;
  editError?: string;
  onEnterEdit: () => void;
  onCancelEdit: () => void;
  editName: string;
  setEditName: (val: string) => void;
  editLocation: string;
  setEditLocation: (val: string) => void;
  saving: boolean;
  saveProfile: () => Promise<void>;
  saveProfileWithPayload: (payload: any) => Promise<void>;
  avatarUploading: boolean;
  avatarUri: string;
  userInitials: string;
  pickAndUploadAvatar: () => Promise<void>;
  colorScheme: "light" | "dark" | null | undefined;
  handleToggleTheme: () => Promise<void>;
  logout: () => Promise<void>;
  router: any;
}

function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View className="mb-4 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/20 px-4 py-3">
      <Text className="text-[13px] font-outfit-m text-red-600 dark:text-red-400">{message}</Text>
    </View>
  );
}

const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  user,
  editMode,
  editError = "",
  onEnterEdit,
  onCancelEdit,
  editName,
  setEditName,
  editLocation,
  setEditLocation,
  saving,
  saveProfile,
  saveProfileWithPayload,
  avatarUploading,
  avatarUri,
  userInitials,
  pickAndUploadAvatar,
  colorScheme,
  handleToggleTheme,
  logout,
  router,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isViewerOpen, setIsViewerOpen] = React.useState(false);

  const handleAvatarPress = () => {
    if (avatarUploading) return;
    setIsMenuOpen(true);
  };

  const saveProfileDirectly = async (payload: any) => {
    try {
      await saveProfileWithPayload(payload);
    } catch (e) {
      const parsedError = parseApiError(e, "Could not update photo.");
      Alert.alert("Error", formatErrorForDisplay(parsedError));
    }
  };

  const handleRemovePhoto = async () => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove your profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setIsMenuOpen(false);
            await saveProfileDirectly({ avatar: "" });
          },
        },
      ]
    );
  };

  return (
    <>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <View className="overflow-hidden rounded-3xl bg-slate-900 shadow-xl mb-6">
          <View className="bg-rose-600 dark:bg-rose-900 px-5 pt-8 pb-16 items-center">
            <Pressable onPress={handleAvatarPress} disabled={avatarUploading} className="active:opacity-80">
              <View className="h-28 w-28 rounded-full border-4 border-white/20 items-center justify-center overflow-hidden bg-slate-800">
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={{ width: 112, height: 112 }} contentFit="cover" />
                ) : (
                  <Text className="text-4xl font-outfit-bl text-white">{userInitials}</Text>
                )}
              </View>
              <View className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-white dark:bg-slate-800 items-center justify-center shadow-lg">
                <Ionicons name={avatarUploading ? "sync-outline" : "camera"} size={16} color="#e11d48" />
              </View>
            </Pressable>
          </View>

          <View className="px-5 pb-6" style={{ marginTop: -40 }}>
            <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-5 py-5 shadow-lg items-center">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="bg-rose-100 dark:bg-rose-900/30 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                  <Text className="text-[10px] font-outfit-bl text-rose-600 dark:text-rose-400 uppercase tracking-widest">SYSTEM ADMIN</Text>
                </View>
              </View>

              <Text className="text-2xl font-outfit-bl text-slate-900 dark:text-white text-center">{user.name}</Text>
              <Text className="text-sm font-outfit text-slate-500 dark:text-slate-400 text-center">{user.email}</Text>

              <View className="w-full h-[1px] bg-slate-100 dark:bg-slate-800 my-5" />

              <View className="flex-row gap-3 w-full">
                <Pressable
                  onPress={() => router.push("/admin")}
                  className="flex-1 bg-slate-900 dark:bg-white py-3 rounded-xl items-center justify-center flex-row gap-2 active:opacity-90"
                >
                  <Ionicons name="apps" size={16} color={colorScheme === "dark" ? "#0f172a" : "#ffffff"} />
                  <Text className="text-white dark:text-slate-900 font-outfit-sb text-[13px]">Dashboard</Text>
                </Pressable>

                <Pressable
                  onPress={onEnterEdit}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 py-3 rounded-xl items-center justify-center flex-row gap-2 border border-slate-200 dark:border-slate-700 active:opacity-90"
                >
                  <Ionicons name="settings-outline" size={16} color={colorScheme === "dark" ? "#cbd5e1" : "#475569"} />
                  <Text className="text-slate-600 dark:text-slate-300 font-outfit-sb text-[13px]">Edit Profile</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {editMode ? (
          <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
            <Text className="text-lg font-outfit-bl text-slate-900 dark:text-white mb-4">Edit Account</Text>

            <ErrorBanner message={editError} />

            <View className="mb-4">
              <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{PROFILE_FIELD_LABELS.name.label}</Text>
              <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-700">
                <Ionicons name="person-outline" size={18} color="#94a3b8" />
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white"
                  placeholder={PROFILE_FIELD_LABELS.name.placeholder}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{PROFILE_FIELD_LABELS.location.label}</Text>
              <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-700">
                <Ionicons name="map-outline" size={18} color="#94a3b8" />
                <TextInput
                  value={editLocation}
                  onChangeText={setEditLocation}
                  className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white"
                  placeholder={PROFILE_FIELD_LABELS.location.placeholder}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <Pressable onPress={onCancelEdit} className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center">
                <Text className="font-outfit-sb text-slate-600 dark:text-slate-300">Cancel</Text>
              </Pressable>
              <Pressable onPress={saveProfile} className="flex-1 py-3.5 rounded-2xl bg-rose-600 items-center shadow-lg shadow-rose-200">
                <Text className="font-outfit-sb text-white">{saving ? "Saving..." : "Save Changes"}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Preferences</Text>
            <SectionCard>
              <SettingRow
                icon={colorScheme === "dark" ? "moon" : "sunny-outline"}
                iconColor={colorScheme === "dark" ? "#818cf8" : "#f59e0b"}
                iconBg={colorScheme === "dark" ? "bg-indigo-100 dark:bg-indigo-900/40" : "bg-amber-50 dark:bg-amber-900/40"}
                title="Theme"
                subtitle={colorScheme === "dark" ? "Dark mode" : "Light mode"}
                onPress={handleToggleTheme}
                rightContent={
                  <View className={`w-12 h-6 rounded-full ${colorScheme === "dark" ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-700"} items-center justify-center px-1 flex-row`}>
                    <View className={`h-4 w-4 rounded-full bg-white dark:bg-slate-200 shadow-sm ${colorScheme === "dark" ? "ml-auto" : "mr-auto"}`} />
                  </View>
                }
              />
            </SectionCard>

            <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-5 mb-2 ml-1">Personal Account</Text>
            <SectionCard>
              <SettingRow href="/admin/sales-dashboard" title="Sales Dashboard" icon="bar-chart-outline" iconColor="#0891b2" iconBg="bg-cyan-50 dark:bg-cyan-950/30" />
              <SettingRow href="/orders" title="My Orders" icon="receipt-outline" iconColor="#6366f1" iconBg="bg-indigo-50 dark:bg-indigo-950/30" />
              <SettingRow href="/devices" title="Active Sessions" icon="shield-half-outline" iconColor="#7c3aed" iconBg="bg-violet-50 dark:bg-violet-950/30" />
              <SettingRow href="/notifications" title="System Alerts" icon="notifications-outline" iconColor="#6366f1" iconBg="bg-indigo-50 dark:bg-indigo-950/30" />
            </SectionCard>

            <View className="mt-8 mb-4">
              <Button title="Sign Out" variant="danger" onPress={logout} />
              <Text className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-3 uppercase tracking-widest font-outfit-sb">Logged in as Administrator</Text>
            </View>
          </>
        )}

        <View className="h-4" />
      </ScrollView>

      <Modal visible={isMenuOpen} transparent animationType="fade" onRequestClose={() => setIsMenuOpen(false)}>
        <Pressable className="flex-1 bg-black/40 items-center justify-center px-8" onPress={() => setIsMenuOpen(false)}>
          <Pressable className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6" onPress={() => {}}>
            <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white mb-6 px-1">Profile Photo</Text>
            <View className="flex-row justify-around">
              {avatarUri ? (
                <View className="items-center">
                  <Pressable onPress={() => { setIsMenuOpen(false); setIsViewerOpen(true); }} className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center justify-center mb-2 active:bg-slate-200">
                    <Ionicons name="eye-outline" size={24} color="#475569" />
                  </Pressable>
                  <Text className="text-[12px] font-outfit-m text-slate-600 dark:text-slate-400">View</Text>
                </View>
              ) : null}

              <View className="items-center">
                <Pressable onPress={() => { setIsMenuOpen(false); pickAndUploadAvatar(); }} className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-900/40 items-center justify-center mb-2 active:bg-rose-100">
                  <Ionicons name={avatarUri ? "sync-outline" : "add-outline"} size={24} color="#e11d48" />
                </Pressable>
                <Text className="text-[12px] font-outfit-m text-slate-600 dark:text-slate-400">{avatarUri ? "Change" : "Add Photo"}</Text>
              </View>

              {avatarUri ? (
                <View className="items-center">
                  <Pressable onPress={handleRemovePhoto} className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-900/40 items-center justify-center mb-2 active:bg-rose-100">
                    <Ionicons name="trash-outline" size={24} color="#e11d48" />
                  </Pressable>
                  <Text className="text-[12px] font-outfit-m text-slate-600 dark:text-slate-400">Remove</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={isViewerOpen} transparent animationType="fade" onRequestClose={() => setIsViewerOpen(false)}>
        <View className="flex-1 bg-black items-center justify-center">
          <View className="absolute top-14 left-0 right-0 flex-row items-center justify-between px-5 z-10">
            <Text className="text-white font-outfit-sb text-[16px]">Profile Photo</Text>
            <Pressable onPress={() => setIsViewerOpen(false)} className="h-10 w-10 rounded-full bg-white/10 items-center justify-center">
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
          </View>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={{ width: "100%", height: "70%" }} contentFit="contain" />
          ) : null}
        </View>
      </Modal>
    </>
  );
};

export default AdminProfileView;
