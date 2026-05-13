import React from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Button } from "../ui/Button";
import { SectionCard } from "../ui/SectionCard";
import { SettingRow } from "../ui/SettingRow";

interface TrustLabel {
  key: string;
  label: string;
  color: string;
}

interface CampusInfo {
  department: string;
  course: string;
  year: string;
  semester: string;
  hostel: string;
  residentType: string;
}

interface UserProfileViewProps {
  user: any;
  profileData: any;
  trustSignals: {
    trustLabels: TrustLabel[];
    [key: string]: any;
  } | undefined;
  completionData: any;
  reputationData: any;
  verificationData: any;
  editMode: boolean;
  setEditMode: (val: boolean) => void;
  editName: string;
  setEditName: (val: string) => void;
  editLocation: string;
  setEditLocation: (val: string) => void;
  editProfileRole: string;
  setEditProfileRole: (val: string) => void;
  editCampus: CampusInfo;
  setEditCampus: React.Dispatch<React.SetStateAction<CampusInfo>>;
  saving: boolean;
  saveProfile: () => Promise<void>;
  avatarUploading: boolean;
  avatarUri: string;
  userInitials: string;
  pickAndUploadAvatar: () => Promise<void>;
  showTradingInfo: boolean;
  setShowTradingInfo: (val: boolean) => void;
  showReputationInfo: boolean;
  setShowReputationInfo: (val: boolean) => void;
  showVerificationInfo: boolean;
  setShowVerificationInfo: (val: boolean) => void;
  verificationMutation: any;
  toneForLabelColor: (color: string) => { bg: string; text: string };
  colorScheme: "light" | "dark" | null | undefined;
  handleToggleTheme: () => Promise<void>;
  logout: () => Promise<void>;
  router: any;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  profileData,
  trustSignals,
  completionData,
  reputationData,
  verificationData,
  editMode,
  setEditMode,
  editName,
  setEditName,
  editLocation,
  setEditLocation,
  editProfileRole,
  setEditProfileRole,
  editCampus,
  setEditCampus,
  saving,
  saveProfile,
  avatarUploading,
  avatarUri,
  userInitials,
  pickAndUploadAvatar,
  showTradingInfo,
  setShowTradingInfo,
  showReputationInfo,
  setShowReputationInfo,
  showVerificationInfo,
  setShowVerificationInfo,
  verificationMutation,
  toneForLabelColor,
  colorScheme,
  handleToggleTheme,
  logout,
  router,
}) => {
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Avatar & Name Hero Card ── */}
      <View className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 mb-4">
        <View className="bg-primary-600 dark:bg-primary-900 px-5 pt-5 pb-14 items-center">
          <Pressable onPress={pickAndUploadAvatar} disabled={avatarUploading} className="active:opacity-80">
            <View className="h-24 w-24 rounded-full border-4 border-white/30 items-center justify-center overflow-hidden bg-primary-500 dark:bg-primary-600">
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ width: 96, height: 96 }} contentFit="cover" />
              ) : (
                <Text className="text-3xl font-outfit-bl text-white">{userInitials}</Text>
              )}
            </View>
            <View className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-white dark:bg-slate-800 items-center justify-center shadow">
              <Ionicons name="camera" size={14} color="#6366f1" />
            </View>
          </Pressable>
          <Text className="text-[11px] font-outfit text-primary-200 mt-2">
            {avatarUploading ? "Uploading..." : "Tap to change photo"}
          </Text>
        </View>

        <View className="px-5 pb-5" style={{ marginTop: -32 }}>
          <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-5 py-4 shadow-sm shadow-slate-200/30 dark:shadow-none">
            {editMode ? (
              <View>
                <View className="mb-3">
                  <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1">Full Name</Text>
                  <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                    <Ionicons name="person-outline" size={15} color="#94a3b8" />
                    <TextInput value={editName} onChangeText={setEditName} className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white" placeholder="Your name" placeholderTextColor="#94a3b8" />
                  </View>
                </View>
                <View className="mb-3">
                  <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1">Location</Text>
                  <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                    <Ionicons name="location-outline" size={15} color="#94a3b8" />
                    <TextInput value={editLocation} onChangeText={setEditLocation} className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white" placeholder="City, State" placeholderTextColor="#94a3b8" />
                  </View>
                </View>
                <View className="mb-5">
                  <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1">Profile Role</Text>
                  <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                    <Ionicons name="briefcase-outline" size={15} color="#94a3b8" />
                    <TextInput value={editProfileRole} onChangeText={setEditProfileRole} className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white" placeholder="e.g. Buyer, Seller" placeholderTextColor="#94a3b8" />
                  </View>
                </View>
                <View className="mb-3">
                  <Text className="text-[11px] font-outfit-sb text-primary-500 uppercase tracking-widest mb-2">🎓 Campus Info</Text>
                  {[
                    { label: "Department", key: "department", icon: "library-outline" as const, placeholder: "e.g. Computer Science" },
                    { label: "Course", key: "course", icon: "book-outline" as const, placeholder: "e.g. B.Tech" },
                    { label: "Year", key: "year", icon: "calendar-outline" as const, placeholder: "e.g. 2nd Year" },
                    { label: "Semester", key: "semester", icon: "layers-outline" as const, placeholder: "e.g. 4th Sem" },
                    { label: "Hostel", key: "hostel", icon: "home-outline" as const, placeholder: "Hostel name" },
                    { label: "Resident Type", key: "residentType", icon: "people-outline" as const, placeholder: "e.g. Day Scholar" },
                  ].map((f) => (
                    <View key={f.key} className="mb-3">
                      <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1">{f.label}</Text>
                      <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                        <Ionicons name={f.icon} size={15} color="#94a3b8" />
                        <TextInput
                          value={editCampus[f.key as keyof CampusInfo]}
                          onChangeText={(t) => setEditCampus((p: CampusInfo) => ({ ...p, [f.key]: t }))}
                          className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white"
                          placeholder={f.placeholder}
                          placeholderTextColor="#94a3b8"
                        />
                      </View>
                    </View>
                  ))}
                </View>
                <View className="flex-row gap-3 mt-1">
                  <View className="flex-1"><Button title="Cancel" variant="outline" onPress={() => setEditMode(false)} /></View>
                  <View className="flex-1"><Button title="Save" onPress={saveProfile} loading={saving} /></View>
                </View>
              </View>
            ) : (
              <>
                <Text className="text-[22px] font-outfit-bl text-slate-900 dark:text-white leading-tight">{user.name}</Text>
                <Text className="mt-0.5 text-[14px] font-outfit text-slate-500 dark:text-slate-400">{user.email}</Text>
                {user.location ? (
                  <View className="flex-row items-center gap-1 mt-1.5">
                    <Ionicons name="location-outline" size={13} color="#94a3b8" />
                    <Text className="text-[13px] font-outfit text-slate-400 dark:text-slate-500">{user.location}</Text>
                  </View>
                ) : null}
                <View className="flex-row flex-wrap gap-2 mt-3">
                  <View className="px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-900"><Text className="text-[11px] font-outfit-sb text-primary-600 dark:text-primary-400 uppercase tracking-widest">{user.role}</Text></View>
                  {user.campus?.department && <View className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800"><Text className="text-[11px] font-outfit-sb text-slate-600 dark:text-slate-300 uppercase tracking-widest">{user.campus.department}</Text></View>}
                </View>
                <Pressable onPress={() => setEditMode(true)} className="mt-4 flex-row items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900 active:bg-primary-100">
                  <Ionicons name="create-outline" size={15} color="#6366f1" />
                  <Text className="text-[13px] font-outfit-sb text-primary-600 dark:text-primary-400">Edit Profile</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>

      {/* ── Trust / Profile Progress ── */}
      {!editMode && (
        <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="shield-checkmark-outline" size={15} color="#6366f1" />
              <Text className="text-[13px] font-outfit-sb text-slate-800 dark:text-slate-200">Profile Completion</Text>
              <Pressable onPress={() => setShowTradingInfo(!showTradingInfo)} hitSlop={10}><Ionicons name="information-circle-outline" size={16} color="#6366f1" /></Pressable>
            </View>
            <View className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${completionData?.canTrade ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-rose-100 dark:bg-rose-900/40'}`}>
              <Ionicons name={completionData?.canTrade ? 'checkmark-circle' : 'lock-closed'} size={11} color={completionData?.canTrade ? '#059669' : '#e11d48'} />
              <Text className={`text-[10px] font-outfit-b ${completionData?.canTrade ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{completionData?.canTrade ? 'Trading Enabled' : 'Trading Locked'}</Text>
            </View>
          </View>
          <View className="mb-1">
            <Text className="text-[13px] font-outfit-m text-slate-500 dark:text-slate-400 mb-2">{completionData?.score ?? 0}% complete</Text>
            <View className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><View className="h-2 rounded-full bg-primary-600" style={{ width: `${Math.max(0, Math.min(100, completionData?.score ?? 0))}%` }} /></View>
          </View>
          {showTradingInfo && (
            <View className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <Text className="text-[11px] font-outfit-sb text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">How Trading Eligibility Works</Text>
              <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400 mb-3 leading-5">Both buyers and sellers must have a 100% complete profile with all required fields filled in.</Text>
              <Text className="text-[10px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-2">Required Fields</Text>
              <View className="gap-1.5 mb-3">
                {[
                  { label: 'Email Verified', key: 'Email verification' },
                  { label: 'Full Name', key: 'Full name' },
                  { label: 'Profile Photo', key: 'Profile photo' },
                  { label: 'Department', key: 'Department' },
                  { label: 'Course', key: 'Course' },
                  { label: 'Campus Role', key: 'Campus role' },
                  { label: 'Year / Level', key: 'Year / study level' },
                  { label: 'Resident Type', key: 'Resident type' },
                  { label: 'Meetup Location', key: 'Preferred campus meetup area' },
                ].map((field, idx) => {
                  const isDone = !completionData?.missing?.includes(field.key);
                  return (
                    <View key={idx} className={`flex-row items-center justify-between px-3 py-2 rounded-xl ${isDone ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                      <Text className={`text-[12px] font-outfit ${isDone ? 'text-slate-600 dark:text-slate-400' : 'text-rose-700 dark:text-rose-400 font-outfit-m'}`}>{field.label}</Text>
                      <Ionicons name={isDone ? 'checkmark-circle' : 'close-circle'} size={14} color={isDone ? '#10b981' : '#f43f5e'} />
                    </View>
                  );
                })}
              </View>
              {completionData?.canTrade ? (
                <View className="flex-row items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40"><Ionicons name="checkmark-circle" size={14} color="#059669" /><Text className="text-[12px] font-outfit-m text-emerald-700 dark:text-emerald-400 flex-1">You are eligible to buy and sell on CampusMitra.</Text></View>
              ) : (
                <View className="flex-row items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40"><Ionicons name="alert-circle" size={14} color="#e11d48" style={{ marginTop: 1 }} /><Text className="text-[12px] font-outfit text-rose-700 dark:text-rose-400 flex-1">Complete <Text className="font-outfit-b">{completionData?.missing?.length ?? 0} missing field{completionData?.missing?.length !== 1 ? 's' : ''}</Text> below to unlock buying and selling.</Text></View>
              )}
            </View>
          )}
          {(trustSignals?.trustLabels || []).length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-3">
              {(trustSignals?.trustLabels || []).map((l: TrustLabel) => {
                const tone = toneForLabelColor(l.color);
                return (<View key={l.key} className={`px-3 py-1 rounded-full ${tone.bg}`}><Text className={`text-[12px] font-outfit-sb ${tone.text}`}>{l.label}</Text></View>);
              })}
            </View>
          )}
        </View>
      )}

      {/* ── Campus Info ── */}
      {user.campus && (user.campus.department || user.campus.course || user.campus.year) && (
        <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none mb-4">
          <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Campus Info</Text>
          {user.campus.department && <View className="flex-row items-center gap-2 mb-2"><Ionicons name="library-outline" size={15} color="#6366f1" /><Text className="text-[14px] font-outfit-m text-slate-800 dark:text-slate-200">{user.campus.department}</Text></View>}
          {user.campus.year && <View className="flex-row items-center gap-2"><Ionicons name="calendar-outline" size={15} color="#6366f1" /><Text className="text-[14px] font-outfit-m text-slate-800 dark:text-slate-200">{user.campus.year} Year</Text></View>}
        </View>
      )}

      {/* ── Reputation & Seller Verification (user only) ── */}
      {!editMode && (
        <>
          {reputationData && (
            <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest">Reputation</Text>
                  <Pressable onPress={() => setShowReputationInfo(!showReputationInfo)} hitSlop={10}><Ionicons name="information-circle-outline" size={16} color="#6366f1" /></Pressable>
                </View>
              </View>

              {showReputationInfo && (
                <View className="mb-4 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40">
                  <Text className="text-[11px] font-outfit-sb text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1.5">Improve Your Score</Text>
                  <View className="gap-2">
                    {[
                      { icon: "checkmark-circle-outline", text: "Complete deals without cancelling" },
                      { icon: "star-outline", text: "Encourage buyers to leave positive reviews" },
                      { icon: "time-outline", text: "Reply to chat messages within 2 hours" },
                      { icon: "cart-outline", text: "Successfully finish more orders" },
                    ].map((item, idx) => (
                      <View key={idx} className="flex-row items-center gap-2">
                        <Ionicons name={item.icon as any} size={12} color="#6366f1" />
                        <Text className="text-[12px] font-outfit text-slate-600 dark:text-slate-400">{item.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              <View className="flex-row flex-wrap gap-2 justify-between">
                {[
                  { label: "Score", value: `${reputationData.reputation?.score ?? 0}/100`, icon: "shield-outline" },
                  { label: "Rate", value: `${reputationData.reputation?.completionRate ?? 0}%`, icon: "trending-up-outline" },
                  { label: "Rating", value: `${reputationData.reputation?.averageRating ?? 0} ★`, icon: "star-outline" },
                  { label: "Orders", value: String(reputationData.reputation?.totalOrders ?? 0), icon: "cart-outline" },
                ].map((m) => {
                  const isOrders = m.label === "Orders";
                  const Card = (
                    <View className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-800/50">
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <Ionicons name={m.icon as any} size={12} color="#6366f1" />
                        <Text className="text-[11px] font-outfit-m text-slate-500 dark:text-slate-400 uppercase tracking-wider">{m.label}</Text>
                      </View>
                      <Text className="text-[18px] font-outfit-bl text-slate-900 dark:text-white" numberOfLines={1}>{m.value}</Text>
                    </View>
                  );

                  return (
                    <View key={m.label} style={{ width: '48.5%' }} className="mb-2">
                      {isOrders ? (
                        <Pressable onPress={() => router.push("/orders")} className="active:opacity-70">
                          {Card}
                        </Pressable>
                      ) : (
                        Card
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest">Seller Verification</Text>
                <Pressable onPress={() => setShowVerificationInfo(!showVerificationInfo)} hitSlop={10}><Ionicons name="information-circle-outline" size={16} color="#6366f1" /></Pressable>
              </View>
              {verificationData?.sellerVerificationStatus === "verified" && <View className="bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full"><Text className="text-[11px] font-outfit-b text-emerald-600 dark:text-emerald-400">✓ Verified</Text></View>}
              {verificationData?.sellerVerificationStatus === "pending" && <View className="bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full"><Text className="text-[11px] font-outfit-b text-amber-600 dark:text-amber-400">Pending</Text></View>}
            </View>

            {showVerificationInfo && (
              <View className="mb-4 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40">
                <Text className="text-[11px] font-outfit-sb text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1.5">Verification Criteria</Text>
                <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400 mb-3 leading-5">Verified sellers earn a badge that builds trust. To apply, you must meet these minimum requirements:</Text>
                <View className="gap-2 mb-2">
                  {[
                    { label: "Email Verified", done: user.emailVerified },
                    { label: "Min. 5 Completed Orders", done: (reputationData?.reputation?.totalOrders ?? 0) >= 5 },
                    { label: "Min. 4.0 Average Rating", done: (reputationData?.reputation?.averageRating ?? 0) >= 4.0 },
                    { label: "Account in Good Standing", done: !user.isSuspended },
                  ].map((item, idx) => (
                    <View key={idx} className="flex-row items-center justify-between px-3 py-1.5 rounded-xl bg-white/50 dark:bg-slate-800/50">
                      <Text className="text-[12px] font-outfit text-slate-600 dark:text-slate-300">{item.label}</Text>
                      <Ionicons name={item.done ? "checkmark-circle" : "close-circle"} size={14} color={item.done ? "#10b981" : "#f43f5e"} />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {(!verificationData?.sellerVerificationStatus || verificationData?.sellerVerificationStatus === "none" || verificationData?.sellerVerificationStatus === "rejected") && (
              <>
                <Text className="text-[13px] font-outfit text-slate-500 dark:text-slate-400 mb-3">Get a verified badge to build buyer trust.</Text>
                <Button title={verificationMutation.isPending ? "Submitting..." : "Request Verification"} onPress={() => verificationMutation.mutate()} loading={verificationMutation.isPending} variant="outline" />
              </>
            )}
          </View>
        </>
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
          onPress={handleToggleTheme}
          rightContent={
            <View className={`w-12 h-6 rounded-full ${colorScheme === "dark" ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-700"} items-center justify-center px-1 flex-row`}>
              <View className={`h-4 w-4 rounded-full bg-white dark:bg-slate-200 shadow-sm ${colorScheme === "dark" ? "ml-auto" : "mr-auto"}`} />
            </View>
          }
        />
      </SectionCard>

      {/* ── Account ── */}
      <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-5 mb-2 ml-1">Account</Text>
      <SectionCard>
        <SettingRow href="/wishlist" title="My Wishlist" icon="heart-outline" iconColor="#e11d48" iconBg="bg-red-50 dark:bg-red-950/30" />
        <SettingRow href="/orders" title="My Orders" icon="receipt-outline" iconColor="#6366f1" iconBg="bg-indigo-50 dark:bg-indigo-950/30" />
        <SettingRow href="/notifications" title="Notifications" icon="notifications-outline" iconColor="#6366f1" iconBg="bg-indigo-50 dark:bg-indigo-950/30" />
        <SettingRow href="/devices" title="Active Devices" icon="phone-portrait-outline" iconColor="#7c3aed" iconBg="bg-violet-50 dark:bg-violet-950/30" />
        <SettingRow href="/dashboard" title="Seller Dashboard" icon="bar-chart-outline" iconColor="#0891b2" iconBg="bg-cyan-50 dark:bg-cyan-950/30" />
        <SettingRow href="/my-products" title="My Listings" icon="layers-outline" iconColor="#059669" iconBg="bg-emerald-50 dark:bg-emerald-950/30" />
        <SettingRow href="/create-product" title="Create New Listing" icon="add-circle-outline" iconColor="#d97706" iconBg="bg-amber-50 dark:bg-amber-950/30" />
      </SectionCard>

      {/* ── Sign Out ── */}
      <View className="mt-6 bg-red-600 rounded-2xl">
        <Button title="Sign Out" variant="outline" onPress={logout} />
      </View>

      <View className="h-4" />
    </ScrollView>
  );
};

export default UserProfileView;
