import React from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Button } from "../ui/Button";
import { SectionCard } from "../ui/SectionCard";
import { SettingRow } from "../ui/SettingRow";

interface AdminProfileViewProps {
  user: any;
  editMode: boolean;
  setEditMode: (val: boolean) => void;
  editName: string;
  setEditName: (val: string) => void;
  editLocation: string;
  setEditLocation: (val: string) => void;
  saving: boolean;
  saveProfile: () => Promise<void>;
  avatarUploading: boolean;
  avatarUri: string;
  userInitials: string;
  pickAndUploadAvatar: () => Promise<void>;
  colorScheme: "light" | "dark" | null | undefined;
  handleToggleTheme: () => Promise<void>;
  logout: () => Promise<void>;
  router: any;
}

const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  user,
  editMode,
  setEditMode,
  editName,
  setEditName,
  editLocation,
  setEditLocation,
  saving,
  saveProfile,
  avatarUploading,
  avatarUri,
  userInitials,
  pickAndUploadAvatar,
  colorScheme,
  handleToggleTheme,
  logout,
  router,
}) => {
  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
      {/* ── Admin Hero Card ── */}
      <View className="overflow-hidden rounded-3xl bg-slate-900 shadow-xl mb-6">
        <View className="bg-rose-600 dark:bg-rose-900 px-5 pt-8 pb-16 items-center">
          <Pressable onPress={pickAndUploadAvatar} disabled={avatarUploading} className="active:opacity-80">
            <View className="h-28 w-28 rounded-full border-4 border-white/20 items-center justify-center overflow-hidden bg-slate-800">
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ width: 112, height: 112 }} contentFit="cover" />
              ) : (
                <Text className="text-4xl font-outfit-bl text-white">{userInitials}</Text>
              )}
            </View>
            <View className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-white items-center justify-center shadow-lg">
              <Ionicons name="camera" size={16} color="#e11d48" />
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
                onPress={() => router.push("/admin-dashboard")}
                className="flex-1 bg-slate-900 dark:bg-white py-3 rounded-xl items-center justify-center flex-row gap-2 active:opacity-90"
              >
                <Ionicons name="apps" size={16} color={colorScheme === 'dark' ? '#0f172a' : '#ffffff'} />
                <Text className="text-white dark:text-slate-900 font-outfit-sb text-[13px]">Dashboard</Text>
              </Pressable>
              
              <Pressable 
                onPress={() => setEditMode(true)}
                className="flex-1 bg-slate-50 dark:bg-slate-800 py-3 rounded-xl items-center justify-center flex-row gap-2 border border-slate-200 dark:border-slate-700 active:opacity-90"
              >
                <Ionicons name="settings-outline" size={16} color={colorScheme === 'dark' ? '#cbd5e1' : '#475569'} />
                <Text className="text-slate-600 dark:text-slate-300 font-outfit-sb text-[13px]">Edit Profile</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* ── Admin Settings ── */}
      {editMode ? (
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
           <Text className="text-lg font-outfit-bl text-slate-900 dark:text-white mb-4">Edit Account</Text>
           
           <View className="mb-4">
              <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Display Name</Text>
              <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-700">
                <Ionicons name="person-outline" size={18} color="#94a3b8" />
                <TextInput value={editName} onChangeText={setEditName} className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white" />
              </View>
           </View>

           <View className="mb-6">
              <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Work Location</Text>
              <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-100 dark:border-slate-700">
                <Ionicons name="map-outline" size={18} color="#94a3b8" />
                <TextInput value={editLocation} onChangeText={setEditLocation} className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white" placeholder="e.g. Remote, Office A" placeholderTextColor="#94a3b8" />
              </View>
           </View>

           <View className="flex-row gap-3">
              <Pressable onPress={() => setEditMode(false)} className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 items-center"><Text className="font-outfit-sb text-slate-600 dark:text-slate-300">Cancel</Text></Pressable>
              <Pressable onPress={saveProfile} className="flex-1 py-3.5 rounded-2xl bg-rose-600 items-center shadow-lg shadow-rose-200"><Text className="font-outfit-sb text-white">Save Changes</Text></Pressable>
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
                  <View className={`h-4 w-4 rounded-full bg-white shadow-sm ${colorScheme === "dark" ? "ml-auto" : "mr-auto"}`} />
                </View>
              }
            />
          </SectionCard>

          <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-5 mb-2 ml-1">System Security</Text>
          <SectionCard>
            <SettingRow href="/devices" title="Active Sessions" icon="shield-half-outline" iconColor="#7c3aed" iconBg="bg-violet-50 dark:bg-violet-950/30" />
            <SettingRow href="/notifications" title="System Alerts" icon="notifications-outline" iconColor="#6366f1" iconBg="bg-indigo-50 dark:bg-indigo-950/30" />
          </SectionCard>

          <View className="mt-8 mb-4">
             <Button 
               title="Sign Out" 
               variant="outline" 
               onPress={logout}
               className="border-rose-100 dark:border-rose-900/30"
               textClassName="text-rose-600"
             />
             <Text className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-3 uppercase tracking-widest font-outfit-sb">Logged in as Administrator</Text>
          </View>
        </>
      )}

      <View className="h-4" />
    </ScrollView>
  );
};

export default AdminProfileView;
