import React from "react";
import { View, Text, Pressable, TextInput, ScrollView, Modal, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Button } from "../ui/Button";
import { SectionCard } from "../ui/SectionCard";
import { SettingRow } from "../ui/SettingRow";
import { parseApiError, formatErrorForDisplay } from "../../lib/utils/errorHandler";
import {
  YEAR_OPTIONS,
  PROFILE_ROLES,
  RESIDENT_TYPE_OPTIONS,
  PROFILE_FIELD_LABELS,
  PROFILE_COMPLETION_CHECKLIST,
  formatProfileRole,
  formatResidentType,
  formatYearDisplay,
  type CampusFormShape,
} from "../../lib/constants/profileForm";

function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View className="mb-3 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/20 px-4 py-3">
      <Text className="text-[13px] font-outfit-m text-red-600 dark:text-red-400">{message}</Text>
    </View>
  );
}

// ── Small reusable info row ────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
  <View className="flex-row items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
    <View className="h-8 w-8 rounded-xl bg-primary-50 dark:bg-primary-950/40 items-center justify-center">
      <Ionicons name={icon} size={15} color="#6366f1" />
    </View>
    <View className="flex-1">
      <Text className="text-[10px] font-outfit-sb text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</Text>
      <Text className="text-[14px] font-outfit-m text-slate-800 dark:text-slate-200 mt-0.5">{value}</Text>
    </View>
  </View>
);

// ── Stat tile ─────────────────────────────────────────────────────────────────
const StatTile = ({ icon, label, value, onPress }: { icon: any; label: string; value: string; onPress?: () => void }) => {
  const inner = (
    <View className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800/50 items-center">
      <Ionicons name={icon} size={18} color="#6366f1" />
      <Text className="text-[20px] font-outfit-bl text-slate-900 dark:text-white mt-1">{value}</Text>
      <Text className="text-[10px] font-outfit-m text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{label}</Text>
    </View>
  );
  if (onPress) return <Pressable onPress={onPress} className="active:opacity-70" style={{ width: "23%" }}>{inner}</Pressable>;
  return <View style={{ width: "23%" }}>{inner}</View>;
};

interface TrustLabel {
  key: string;
  label: string;
  color: string;
}

type CampusInfo = CampusFormShape;

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
  editError: string;
  setEditError: (val: string) => void;
  onEnterEdit: () => void;
  onCancelEdit: () => void;
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
  saveProfileWithPayload: (payload: any) => Promise<void>;
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
  editError,
  setEditError,
  onEnterEdit,
  onCancelEdit,
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
  saveProfileWithPayload,
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
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isViewerOpen, setIsViewerOpen] = React.useState(false);

  const clearError = () => {
    if (editError) setEditError("");
  };

  const showYearField =
    editProfileRole === "student" || editProfileRole === "faculty" || editProfileRole === "alumni";

  const handleAvatarPress = () => {
    if (avatarUploading) return;
    setIsMenuOpen(true);
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
            try {
              await saveProfileDirectly({ avatar: "" });
            } catch {
              // Error handled in saveProfileDirectly
            }
          } 
        }
      ]
    );
  };

  // Helper to save profile without full edit mode logic
  const saveProfileDirectly = async (payload: any) => {
    try {
      await saveProfileWithPayload(payload);
    } catch (e) {
      const parsedError = parseApiError(e, "Could not update photo.");
      Alert.alert("Error", formatErrorForDisplay(parsedError));
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
      keyboardDismissMode="none"
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero Card: Avatar + Name + Role + Location ── */}
      <View className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
        {/* Gradient banner */}
        <View className="bg-primary-600 dark:bg-primary-900 h-24" />

        <View className="px-5 pb-5" style={{ marginTop: -40 }}>
          {/* Avatar row */}
          <View className="flex-row items-end justify-between mb-4">
            <Pressable onPress={handleAvatarPress} disabled={avatarUploading} className="active:opacity-80">
              <View className="h-20 w-20 rounded-2xl border-4 border-white dark:border-slate-900 items-center justify-center overflow-hidden bg-primary-500 shadow-md">
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={{ width: 80, height: 80 }} contentFit="cover" />
                ) : (
                  <Text className="text-2xl font-outfit-bl text-white">{userInitials}</Text>
                )}
              </View>
              <View className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white dark:bg-slate-800 items-center justify-center shadow border border-slate-100 dark:border-slate-700">
                <Ionicons name="camera" size={12} color="#6366f1" />
              </View>
            </Pressable>

            {!editMode && (
              <Pressable
                onPress={onEnterEdit}
                className="flex-row items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900 active:bg-primary-100"
              >
                <Ionicons name="create-outline" size={14} color="#6366f1" />
                <Text className="text-[13px] font-outfit-sb text-primary-600 dark:text-primary-400">Edit</Text>
              </Pressable>
            )}
          </View>

          {editMode ? (
            /* ── Edit Form ── */
            <View>
              <ErrorBanner message={editError} />

              <View className="mb-3">
                <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1">{PROFILE_FIELD_LABELS.name.label}</Text>
                <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                  <Ionicons name="person-outline" size={15} color="#94a3b8" />
                  <TextInput
                    value={editName}
                    onChangeText={(t) => { clearError(); setEditName(t); }}
                    className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white"
                    placeholder={PROFILE_FIELD_LABELS.name.placeholder}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1">{PROFILE_FIELD_LABELS.location.label}</Text>
                <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                  <Ionicons name="location-outline" size={15} color="#94a3b8" />
                  <TextInput
                    value={editLocation}
                    onChangeText={(t) => { clearError(); setEditLocation(t); }}
                    className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white"
                    placeholder={PROFILE_FIELD_LABELS.location.placeholder}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-2">{PROFILE_FIELD_LABELS.profileRole.label}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {PROFILE_ROLES.map((r) => (
                    <Pressable
                      key={r.id}
                      onPress={() => {
                        clearError();
                        setEditProfileRole(r.id);
                        if (r.id === "staff" || r.id === "alumni") {
                          setEditCampus((p) => ({ ...p, year: "" }));
                        }
                      }}
                      className={`min-w-[30%] flex-1 py-2.5 rounded-xl border items-center ${
                        editProfileRole === r.id
                          ? "bg-primary-600 dark:bg-primary-500 border-primary-600 dark:border-primary-500"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Text
                        className={`text-[12px] font-outfit-sb ${
                          editProfileRole === r.id ? "text-white" : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {r.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Text className="text-[11px] font-outfit-sb text-primary-500 uppercase tracking-widest mb-2 mt-1">{PROFILE_FIELD_LABELS.campusSection.label}</Text>

              <View className="mb-3">
                <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1">{PROFILE_FIELD_LABELS.department.label}</Text>
                <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                  <Ionicons name="library-outline" size={15} color="#94a3b8" />
                  <TextInput
                    value={editCampus.department}
                    onChangeText={(t) => { clearError(); setEditCampus((p) => ({ ...p, department: t })); }}
                    className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white"
                    placeholder={PROFILE_FIELD_LABELS.department.placeholder}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1">{PROFILE_FIELD_LABELS.course.label}</Text>
                <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                  <Ionicons name="book-outline" size={15} color="#94a3b8" />
                  <TextInput
                    value={editCampus.course}
                    onChangeText={(t) => { clearError(); setEditCampus((p) => ({ ...p, course: t })); }}
                    className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white"
                    placeholder={PROFILE_FIELD_LABELS.course.placeholder}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              {showYearField && (
                <View className="mb-3">
                  <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-2">{PROFILE_FIELD_LABELS.year.label}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {YEAR_OPTIONS.map((year) => (
                      <Pressable
                        key={year}
                        onPress={() => {
                          clearError();
                          setEditCampus((p) => ({ ...p, year: p.year === year ? "" : year }));
                        }}
                        className={`px-3 py-2 rounded-xl border ${
                          editCampus.year === year
                            ? "bg-primary-600 dark:bg-primary-500 border-primary-600 dark:border-primary-500"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <Text
                          className={`text-[12px] font-outfit-sb ${
                            editCampus.year === year ? "text-white" : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {year}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              <View className="mb-3">
                <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1">{PROFILE_FIELD_LABELS.semester.label}</Text>
                <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                  <Ionicons name="layers-outline" size={15} color="#94a3b8" />
                  <TextInput
                    value={editCampus.semester}
                    onChangeText={(t) => { clearError(); setEditCampus((p) => ({ ...p, semester: t })); }}
                    className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white"
                    placeholder={PROFILE_FIELD_LABELS.semester.placeholder}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-2">{PROFILE_FIELD_LABELS.residentType.label}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {RESIDENT_TYPE_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.id}
                      onPress={() => {
                        clearError();
                        setEditCampus((p) => ({
                          ...p,
                          residentType: p.residentType === opt.id ? "" : opt.id,
                        }));
                      }}
                      className={`px-3 py-2 rounded-xl border ${
                        editCampus.residentType === opt.id
                          ? "bg-primary-600 dark:bg-primary-500 border-primary-600 dark:border-primary-500"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Text
                        className={`text-[12px] font-outfit-sb ${
                          editCampus.residentType === opt.id ? "text-white" : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1">{PROFILE_FIELD_LABELS.hostel.label}</Text>
                <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                  <Ionicons name="home-outline" size={15} color="#94a3b8" />
                  <TextInput
                    value={editCampus.hostel}
                    onChangeText={(t) => { clearError(); setEditCampus((p) => ({ ...p, hostel: t })); }}
                    className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white"
                    placeholder={PROFILE_FIELD_LABELS.hostel.placeholder}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View className="flex-row gap-3 mt-2">
                <View className="flex-1"><Button title="Cancel" variant="outline" onPress={onCancelEdit} /></View>
                <View className="flex-1"><Button title="Save" onPress={saveProfile} loading={saving} /></View>
              </View>
            </View>
          ) : (
            /* ── View Mode ── */
            <View>
              {/* Name + role badge */}
              <View className="flex-row items-center gap-2 flex-wrap mb-1">
                <Text className="text-[22px] font-outfit-bl text-slate-900 dark:text-white leading-tight">{user.name}</Text>
                <View className="px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-900">
                  <Text className="text-[10px] font-outfit-sb text-primary-600 dark:text-primary-400 uppercase tracking-widest">
                    {formatProfileRole(user.profileRole) || user.role}
                  </Text>
                </View>
              </View>

              {/* Location */}
              {user.location ? (
                <View className="flex-row items-center gap-1 mb-2">
                  <Ionicons name="location-outline" size={13} color="#94a3b8" />
                  <Text className="text-[13px] font-outfit text-slate-400 dark:text-slate-500">{user.location}</Text>
                </View>
              ) : null}

              {/* Trust labels */}
              {(trustSignals?.trustLabels || []).length > 0 && (
                <View className="flex-row flex-wrap gap-1.5 mt-1">
                  {(trustSignals?.trustLabels || []).map((l: TrustLabel) => {
                    const tone = toneForLabelColor(l.color);
                    return (
                      <View key={l.key} className={`px-2.5 py-0.5 rounded-full ${tone.bg}`}>
                        <Text className={`text-[11px] font-outfit-sb ${tone.text}`}>{l.label}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* ── Campus Info Card ── */}
      {!editMode && user.campus && (user.campus.department || user.campus.course || user.campus.year || user.campus.semester || user.campus.hostel || user.campus.residentType) && (
        <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 pt-4 pb-2 shadow-sm mb-4">
          <Text className="text-[11px] font-outfit-sb text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Campus Info</Text>
          {user.campus.department && <InfoRow icon="library-outline" label="Department" value={user.campus.department} />}
          {user.campus.course && <InfoRow icon="book-outline" label="Course" value={user.campus.course} />}
          {user.campus.year && <InfoRow icon="calendar-outline" label="Year" value={formatYearDisplay(user.campus.year)} />}
          {user.campus.semester && <InfoRow icon="layers-outline" label="Semester" value={user.campus.semester} />}
          {user.campus.hostel && <InfoRow icon="home-outline" label="Hostel" value={user.campus.hostel} />}
          {user.campus.residentType && <InfoRow icon="people-outline" label="Resident Type" value={formatResidentType(user.campus.residentType)} />}
        </View>
      )}

      {/* ── Profile Completion ── */}
      {!editMode && (
        <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="shield-checkmark-outline" size={15} color="#6366f1" />
              <Text className="text-[13px] font-outfit-sb text-slate-800 dark:text-slate-200">Profile Completion</Text>
              <Pressable onPress={() => setShowTradingInfo(!showTradingInfo)} hitSlop={10}>
                <Ionicons name="information-circle-outline" size={16} color="#6366f1" />
              </Pressable>
            </View>
            <View className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${completionData?.canTrade ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-rose-100 dark:bg-rose-900/40'}`}>
              <Ionicons name={completionData?.canTrade ? 'checkmark-circle' : 'lock-closed'} size={11} color={completionData?.canTrade ? '#059669' : '#e11d48'} />
              <Text className={`text-[10px] font-outfit-b ${completionData?.canTrade ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {completionData?.canTrade ? 'Trading Enabled' : 'Trading Locked'}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View className="flex-row items-center gap-3 mb-1">
            <View className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <View className="h-2 rounded-full bg-primary-600" style={{ width: `${Math.max(0, Math.min(100, completionData?.score ?? 0))}%` }} />
            </View>
            <Text className="text-[13px] font-outfit-sb text-slate-600 dark:text-slate-400 w-10 text-right">{completionData?.score ?? 0}%</Text>
          </View>

          {showTradingInfo && (
            <View className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <Text className="text-[11px] font-outfit-sb text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Required Fields</Text>
              <View className="gap-1.5 mb-3">
                {PROFILE_COMPLETION_CHECKLIST.map((field, idx) => {
                  const isDone = !completionData?.missing?.includes(field.key);
                  return (
                    <View key={idx} className={`flex-row items-center justify-between px-3 py-2 rounded-xl ${isDone ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                      <Text className={`text-[12px] font-outfit ${isDone ? 'text-slate-600 dark:text-slate-400' : 'text-rose-700 dark:text-rose-400 font-outfit-m'}`}>{field.label}</Text>
                      <Ionicons name={isDone ? 'checkmark-circle' : 'close-circle'} size={14} color={isDone ? '#10b981' : '#f43f5e'} />
                    </View>
                  );
                })}
              </View>
              {!completionData?.canTrade && (
                <View className="flex-row items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40">
                  <Ionicons name="alert-circle" size={14} color="#e11d48" style={{ marginTop: 1 }} />
                  <Text className="text-[12px] font-outfit text-rose-700 dark:text-rose-400 flex-1">
                    Complete <Text className="font-outfit-b">{completionData?.missing?.length ?? 0} missing field{completionData?.missing?.length !== 1 ? 's' : ''}</Text> to unlock trading.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* ── Reputation ── */}
      {!editMode && reputationData && (
        <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="star-outline" size={15} color="#6366f1" />
              <Text className="text-[13px] font-outfit-sb text-slate-800 dark:text-slate-200">Reputation</Text>
              <Pressable onPress={() => setShowReputationInfo(!showReputationInfo)} hitSlop={10}>
                <Ionicons name="information-circle-outline" size={16} color="#6366f1" />
              </Pressable>
            </View>
          </View>

          {showReputationInfo && (
            <View className="mb-4 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40">
              <Text className="text-[11px] font-outfit-sb text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Improve Your Score</Text>
              {[
                { icon: "checkmark-circle-outline", text: "Complete deals without cancelling" },
                { icon: "star-outline", text: "Encourage buyers to leave positive reviews" },
                { icon: "time-outline", text: "Reply to messages within 2 hours" },
                { icon: "cart-outline", text: "Successfully finish more orders" },
              ].map((item, idx) => (
                <View key={idx} className="flex-row items-center gap-2 mb-1.5">
                  <Ionicons name={item.icon as any} size={12} color="#6366f1" />
                  <Text className="text-[12px] font-outfit text-slate-600 dark:text-slate-400">{item.text}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 4-column stat row */}
          <View className="flex-row justify-between gap-2">
            <StatTile icon="shield-outline" label="Score" value={`${reputationData.reputation?.score ?? 0}`} />
            <StatTile icon="trending-up-outline" label="Rate" value={`${reputationData.reputation?.completionRate ?? 0}%`} />
            <StatTile icon="star-outline" label="Rating" value={`${reputationData.reputation?.averageRating ?? 0}★`} />
            <StatTile icon="cart-outline" label="Orders" value={String(reputationData.reputation?.totalOrders ?? 0)} onPress={() => router.push("/orders")} />
          </View>
        </View>
      )}

      {/* ── Seller Verification ── */}
      {!editMode && (
        <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="ribbon-outline" size={15} color="#6366f1" />
              <Text className="text-[13px] font-outfit-sb text-slate-800 dark:text-slate-200">Seller Verification</Text>
              <Pressable onPress={() => setShowVerificationInfo(!showVerificationInfo)} hitSlop={10}>
                <Ionicons name="information-circle-outline" size={16} color="#6366f1" />
              </Pressable>
            </View>
            {verificationData?.sellerVerificationStatus === "verified" && (
              <View className="bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 rounded-full">
                <Text className="text-[11px] font-outfit-b text-emerald-600 dark:text-emerald-400">✓ Verified</Text>
              </View>
            )}
            {verificationData?.sellerVerificationStatus === "pending" && (
              <View className="bg-amber-50 dark:bg-amber-900/30 px-2.5 py-0.5 rounded-full">
                <Text className="text-[11px] font-outfit-b text-amber-600 dark:text-amber-400">Pending Review</Text>
              </View>
            )}
          </View>

          {showVerificationInfo && (
            <View className="mb-4 p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40">
              <Text className="text-[11px] font-outfit-sb text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Verification Criteria</Text>
              {[
                { label: "Email Verified", done: user.emailVerified },
                { label: "Min. 5 Completed Orders", done: (reputationData?.reputation?.totalOrders ?? 0) >= 5 },
                { label: "Min. 4.0 Average Rating", done: (reputationData?.reputation?.averageRating ?? 0) >= 4.0 },
                { label: "Account in Good Standing", done: !user.isSuspended },
              ].map((item, idx) => (
                <View key={idx} className="flex-row items-center justify-between px-3 py-1.5 rounded-xl bg-white/50 dark:bg-slate-800/50 mb-1">
                  <Text className="text-[12px] font-outfit text-slate-600 dark:text-slate-300">{item.label}</Text>
                  <Ionicons name={item.done ? "checkmark-circle" : "close-circle"} size={14} color={item.done ? "#10b981" : "#f43f5e"} />
                </View>
              ))}
            </View>
          )}

          {(!verificationData?.sellerVerificationStatus || verificationData?.sellerVerificationStatus === "none" || verificationData?.sellerVerificationStatus === "rejected") && (
            <>
              <Text className="text-[13px] font-outfit text-slate-500 dark:text-slate-400 mb-3">Get a verified badge to build buyer trust.</Text>
              <Button title={verificationMutation.isPending ? "Submitting..." : "Request Verification"} onPress={() => verificationMutation.mutate()} loading={verificationMutation.isPending} variant="outline" />
            </>
          )}
        </View>
      )}

      {/* ── Preferences ── */}
      <Text className="text-[11px] font-outfit-sb text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Preferences</Text>
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
      <Text className="text-[11px] font-outfit-sb text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-5 mb-2 ml-1">Account</Text>
      <SectionCard>
        <SettingRow href="/wishlist" title="My Wishlist" icon="heart-outline" iconColor="#e11d48" iconBg="bg-red-50 dark:bg-red-950/30" />
        <SettingRow href="/orders" title="My Orders" icon="receipt-outline" iconColor="#6366f1" iconBg="bg-indigo-50 dark:bg-indigo-950/30" />
        <SettingRow href="/notifications" title="Notifications" icon="notifications-outline" iconColor="#6366f1" iconBg="bg-indigo-50 dark:bg-indigo-950/30" />
        <SettingRow href="/dashboard" title="Seller Dashboard" icon="bar-chart-outline" iconColor="#0891b2" iconBg="bg-cyan-50 dark:bg-cyan-950/30" />
        <SettingRow href="/my-products" title="My Listings" icon="layers-outline" iconColor="#059669" iconBg="bg-emerald-50 dark:bg-emerald-950/30" />
        <SettingRow href="/create-product" title="Create New Listing" icon="add-circle-outline" iconColor="#d97706" iconBg="bg-amber-50 dark:bg-amber-950/30" />
        <SettingRow href="/settings" title="Settings" icon="settings-outline" iconColor="#475569" iconBg="bg-slate-100 dark:bg-slate-800" />
      </SectionCard>

      {/* ── Sign Out ── */}
      <View className="mt-8">
        <Button title="Sign Out" variant="danger" onPress={logout} />
      </View>

      <View className="h-4" />

      {/* ── Photo Management Modal ── */}
      <Modal visible={isMenuOpen} transparent animationType="slide" onRequestClose={() => setIsMenuOpen(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <Pressable className="flex-1" onPress={() => setIsMenuOpen(false)} />
          <View className="bg-white dark:bg-slate-900 rounded-t-[32px] px-6 pt-2 pb-8">
            <View className="h-1.5 w-12 bg-slate-200 dark:bg-slate-800 rounded-full self-center mb-6" />
            <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white mb-6 px-1">Profile Photo</Text>
            <View className="flex-row items-center justify-start gap-6">
              {avatarUri ? (
                <View className="items-center">
                  <Pressable onPress={() => { setIsMenuOpen(false); setIsViewerOpen(true); }} className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 items-center justify-center mb-2 active:bg-indigo-100">
                    <Ionicons name="eye-outline" size={24} color="#6366f1" />
                  </Pressable>
                  <Text className="text-[12px] font-outfit-m text-slate-600 dark:text-slate-400">View</Text>
                </View>
              ) : null}
              <View className="items-center">
                <Pressable onPress={() => { setIsMenuOpen(false); pickAndUploadAvatar(); }} className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 items-center justify-center mb-2 active:bg-indigo-100">
                  <Ionicons name={avatarUri ? "sync-outline" : "add-outline"} size={24} color="#6366f1" />
                </Pressable>
                <Text className="text-[12px] font-outfit-m text-slate-600 dark:text-slate-400">{avatarUri ? "Change" : "Add Photo"}</Text>
              </View>
              {avatarUri ? (
                <View className="items-center">
                  <Pressable onPress={handleRemovePhoto} className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-900/40 items-center justify-center mb-2 active:bg-rose-100">
                    <Ionicons name="trash-outline" size={24} color="#f43f5e" />
                  </Pressable>
                  <Text className="text-[12px] font-outfit-m text-slate-600 dark:text-slate-400">Remove</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Photo Viewer Modal ── */}
      <Modal visible={isViewerOpen} transparent animationType="fade" onRequestClose={() => setIsViewerOpen(false)}>
        <View className="flex-1 bg-black items-center justify-center">
          <View className="absolute top-0 left-0 right-0 p-6 flex-row items-center justify-between z-10" style={{ paddingTop: 60 }}>
            <Pressable onPress={() => setIsViewerOpen(false)} className="h-10 w-10 items-center justify-center rounded-full bg-black/40">
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
            <Text className="text-white font-outfit-sb text-[16px]">Profile Photo</Text>
            <View className="w-10" />
          </View>
          {avatarUri && (
            <Image source={{ uri: avatarUri }} style={{ width: "100%", height: "70%" }} contentFit="contain" />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
};

export default UserProfileView;
