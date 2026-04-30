import { Link, router } from "expo-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useColorScheme } from "nativewind";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { SettingRow } from "../../components/ui/SettingRow";
import { SectionCard } from "../../components/ui/SectionCard";
import { saveThemePreference, loadThemePreference } from "../../lib/theme-storage";
import { getUserProfile, uploadUserAvatar, getMyReputation, getMySellerVerification, requestSellerVerification, getProfileCompletion } from "../../lib/api/users";

type TrustLabel = { key: string; label: string; color: string };
type TrustSignals = {
  profileCompletionScore: number;
  trustLabels: TrustLabel[];
  canTrade: boolean;
  missing: string[];
};
type ProfileCompletion = {
  score: number;
  missing: string[];
  isComplete: boolean;
  canTrade: boolean;
};

export default function ProfileScreen() {
  const {
    user,
    loading,
    logout,
    updateProfile,
    refreshUser: refreshAuthUser,
  } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [editLocation, setEditLocation] = useState(user?.location || "");
  const [editProfileRole, setEditProfileRole] = useState(user?.profileRole || "");

  // Fix B4: persist theme choice across restarts
  const handleToggleTheme = async () => {
    const next = colorScheme === "dark" ? "light" : "dark";
    toggleColorScheme();
    await saveThemePreference(next);
  };

  const [editCampus, setEditCampus] = useState({
    department: user?.campus?.department || "",
    course: user?.campus?.course || "",
    year: user?.campus?.year || "",
    semester: user?.campus?.semester || "",
    hostel: user?.campus?.hostel || "",
    residentType: user?.campus?.residentType || "",
  });
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showTradingInfo, setShowTradingInfo] = useState(false);

  const {
    data: profileData,
    refetch: refetchTrust,
    isLoading: profileTrustLoading,
    isError: profileTrustError,
  } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: () => getUserProfile(user!.id),
    enabled: !!user?.id,
  });

  const trustSignals = profileData?.trustSignals as TrustSignals | undefined;

  const {
    data: completionData,
    refetch: refetchCompletion,
  } = useQuery({
    queryKey: ["profile-completion"],
    queryFn: getProfileCompletion,
    enabled: !!user?.id,
    select: (d) => d as ProfileCompletion,
  });

  const { data: reputationData } = useQuery({
    queryKey: ["my-reputation"],
    queryFn: getMyReputation,
    enabled: !!user?.id && user.role === "user",
  });

  const { data: verificationData, refetch: refetchVerification } = useQuery({
    queryKey: ["my-seller-verification"],
    queryFn: getMySellerVerification,
    enabled: !!user?.id && user.role === "user",
  });
  const verificationMutation = useMutation({
    mutationFn: requestSellerVerification,
    onSuccess: () => {
      Alert.alert("Submitted", "Your seller verification request has been submitted.");
      refetchVerification();
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert("Error", msg || "Could not submit verification request.");
    },
  });

  const saveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        location: editLocation.trim(),
        profileRole: editProfileRole.trim(),
        campus: { ...editCampus },
      });
      setEditMode(false);
      await refetchTrust();
      await refetchCompletion();
    } catch {
      Alert.alert("Error", "Could not update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toneForLabelColor = (c?: string) => {
    switch (c) {
      case "green":
        return { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-200" };
      case "blue":
        return { bg: "bg-indigo-50 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-200" };
      case "emerald":
        return { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-200" };
      case "amber":
        return { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-200" };
      case "purple":
        return { bg: "bg-violet-50 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-200" };
      case "gray":
        return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300" };
      default:
        return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300" };
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
  const avatarFromAuth = user.avatar?.trim?.() ? String(user.avatar) : "";
  const avatarFromProfile =
    profileData?.user?.avatar && String(profileData.user.avatar).trim()
      ? String(profileData.user.avatar)
      : "";
  const avatarUri = avatarFromProfile || avatarFromAuth;

  const pickAndUploadAvatar = async () => {
    if (avatarUploading) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission", "Photo access is required to set a profile picture.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (res.canceled || !res.assets?.length) return;

    const asset = res.assets[0];
    const uri = asset.uri;
    const mimeType = asset.mimeType || "image/jpeg";
    const ext = (mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg");

    const fd = new FormData();
    if (Platform.OS === "web") {
      const blob = await fetch(uri).then((r) => r.blob());
      fd.append("avatar", blob, `avatar.${ext}`);
    } else {
      fd.append("avatar", {
        uri,
        name: `avatar.${ext}`,
        type: mimeType,
      } as unknown as Blob);
    }

    setAvatarUploading(true);
    try {
      await uploadUserAvatar(user.id, fd);
      await refreshAuthUser();
      await refetchTrust();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert("Upload failed", msg || "Could not upload profile photo.");
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <Screen>
      {/* ── Page Header ── */}
      <PageHeader title="My Profile" subtitle={user?.email} />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* ── Avatar & Name Hero Card ── */}
        <View className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 mb-4">

          {/* Gradient banner strip */}
          <View className="bg-primary-600 dark:bg-primary-900 px-5 pt-5 pb-14 items-center">
            <Pressable onPress={pickAndUploadAvatar} disabled={avatarUploading} className="active:opacity-80">
              <View className="h-24 w-24 rounded-full border-4 border-white/30 items-center justify-center overflow-hidden bg-primary-500">
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={{ width: 96, height: 96 }} contentFit="cover" />
                ) : (
                  <Text className="text-3xl font-outfit-bl text-white">{userInitials}</Text>
                )}
              </View>
              <View className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-white items-center justify-center shadow">
                <Ionicons name="camera" size={14} color="#6366f1" />
              </View>
            </Pressable>
            <Text className="text-[11px] font-outfit text-primary-200 mt-2">
              {avatarUploading ? "Uploading..." : "Tap to change photo"}
            </Text>
          </View>

          {/* Info pulled up over the banner */}
          <View className="px-5 pb-5" style={{ marginTop: -32 }}>
            <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-5 py-4 shadow-sm shadow-slate-200/30 dark:shadow-none">
              {editMode ? (
                <View>
                  {/* Name */}
                  <View className="mb-3">
                    <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1">Full Name</Text>
                    <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                      <Ionicons name="person-outline" size={15} color="#94a3b8" />
                      <TextInput
                        value={editName}
                        onChangeText={setEditName}
                        className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white"
                        placeholder="Your name"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>

                  {/* Location */}
                  <View className="mb-3">
                    <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1">Location</Text>
                    <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                      <Ionicons name="location-outline" size={15} color="#94a3b8" />
                      <TextInput
                        value={editLocation}
                        onChangeText={setEditLocation}
                        className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white"
                        placeholder="City, State"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>

                  {/* Profile Role */}
                  <View className="mb-5">
                    <Text className="text-[11px] font-outfit-sb text-slate-400 uppercase tracking-widest mb-1">Profile Role</Text>
                    <View className="flex-row items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                      <Ionicons name="briefcase-outline" size={15} color="#94a3b8" />
                      <TextInput
                        value={editProfileRole}
                        onChangeText={setEditProfileRole}
                        className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white"
                        placeholder="e.g. Buyer, Seller"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>

                  {/* Campus Section */}
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
                            value={editCampus[f.key as keyof typeof editCampus]}
                            onChangeText={(t) => setEditCampus((p) => ({ ...p, [f.key]: t }))}
                            className="flex-1 text-[15px] font-outfit text-slate-800 dark:text-white"
                            placeholder={f.placeholder}
                            placeholderTextColor="#94a3b8"
                          />
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-3 mt-1">
                    <View className="flex-1">
                      <Button
                        title="Cancel"
                        variant="outline"
                        onPress={() => {
                          setEditMode(false);
                          setEditName(user.name || "");
                          setEditPhone(user.phone || "");
                          setEditLocation(user.location || "");
                          setEditProfileRole(user.profileRole || "");
                          setEditCampus({
                            department: user.campus?.department || "",
                            course: user.campus?.course || "",
                            year: user.campus?.year || "",
                            semester: user.campus?.semester || "",
                            hostel: user.campus?.hostel || "",
                            residentType: user.campus?.residentType || "",
                          });
                        }}
                      />
                    </View>
                    <View className="flex-1">
                      <Button title="Save" onPress={saveProfile} loading={saving} />
                    </View>
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
                    <View className="px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-900">
                      <Text className="text-[11px] font-outfit-sb text-primary-600 dark:text-primary-400 uppercase tracking-widest">{user.role}</Text>
                    </View>
                    {user.campus?.department ? (
                      <View className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                        <Text className="text-[11px] font-outfit-sb text-slate-600 dark:text-slate-300 uppercase tracking-widest">{user.campus.department}</Text>
                      </View>
                    ) : null}
                    {user.campus?.course ? (
                      <View className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                        <Text className="text-[11px] font-outfit-sb text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{user.campus.course}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Pressable
                    onPress={() => {
                      setEditName(user.name || "");
                      setEditPhone(user.phone || "");
                      setEditLocation(user.location || "");
                      setEditProfileRole(user.profileRole || "");
                      setEditCampus({
                        department: user.campus?.department || "",
                        course: user.campus?.course || "",
                        year: user.campus?.year || "",
                        semester: user.campus?.semester || "",
                        hostel: user.campus?.hostel || "",
                        residentType: user.campus?.residentType || "",
                      });
                      setEditMode(true);
                    }}
                    className="mt-4 flex-row items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900 active:bg-primary-100"
                  >
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
            {/* Header */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="shield-checkmark-outline" size={15} color="#6366f1" />
                <Text className="text-[13px] font-outfit-sb text-slate-800 dark:text-slate-200">
                  Profile Completion
                </Text>
                <Pressable onPress={() => setShowTradingInfo(!showTradingInfo)} hitSlop={10}>
                  <Ionicons name="information-circle-outline" size={16} color="#6366f1" />
                </Pressable>
              </View>
              {/* Trading status badge */}
              <View className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${
                completionData?.canTrade
                  ? 'bg-emerald-100 dark:bg-emerald-900/40'
                  : 'bg-rose-100 dark:bg-rose-900/40'
              }`}>
                <Ionicons
                  name={completionData?.canTrade ? 'checkmark-circle' : 'lock-closed'}
                  size={11}
                  color={completionData?.canTrade ? '#059669' : '#e11d48'}
                />
                <Text className={`text-[10px] font-outfit-b ${
                  completionData?.canTrade ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {completionData?.canTrade ? 'Trading Enabled' : 'Trading Locked'}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View className="mb-1">
              <Text className="text-[13px] font-outfit-m text-slate-500 dark:text-slate-400 mb-2">
                {completionData?.score ?? 0}% complete
              </Text>
              <View className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <View
                  className="h-2 rounded-full bg-primary-600"
                  style={{ width: `${Math.max(0, Math.min(100, completionData?.score ?? 0))}%` }}
                />
              </View>
            </View>

            {/* Eligibility detail panel */}
            {showTradingInfo && (
              <View className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <Text className="text-[11px] font-outfit-sb text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">
                  How Trading Eligibility Works
                </Text>
                <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400 mb-3 leading-5">
                  Both buyers and sellers must have a 100% complete profile with all required fields filled in.
                </Text>

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
                      <View key={idx} className={`flex-row items-center justify-between px-3 py-2 rounded-xl ${
                        isDone ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'
                      }`}>
                        <Text className={`text-[12px] font-outfit ${
                          isDone ? 'text-slate-600 dark:text-slate-400' : 'text-rose-700 dark:text-rose-400 font-outfit-m'
                        }`}>{field.label}</Text>
                        <Ionicons
                          name={isDone ? 'checkmark-circle' : 'close-circle'}
                          size={14}
                          color={isDone ? '#10b981' : '#f43f5e'}
                        />
                      </View>
                    );
                  })}
                </View>

                {/* Overall status message */}
                {completionData?.canTrade ? (
                  <View className="flex-row items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40">
                    <Ionicons name="checkmark-circle" size={14} color="#059669" />
                    <Text className="text-[12px] font-outfit-m text-emerald-700 dark:text-emerald-400 flex-1">
                      You are eligible to buy and sell on CampusMitra.
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40">
                    <Ionicons name="alert-circle" size={14} color="#e11d48" style={{ marginTop: 1 }} />
                    <Text className="text-[12px] font-outfit text-rose-700 dark:text-rose-400 flex-1">
                      Complete <Text className="font-outfit-b">{completionData?.missing?.length ?? 0} missing field{completionData?.missing?.length !== 1 ? 's' : ''}</Text> below to unlock buying and selling.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Trust labels */}
            {(trustSignals?.trustLabels || []).length > 0 && (
              <View className="flex-row flex-wrap gap-2 mt-3">
                {(trustSignals?.trustLabels || []).map((l) => {
                  const tone = toneForLabelColor(l.color);
                  return (
                    <View key={l.key} className={`px-3 py-1 rounded-full ${tone.bg}`}>
                      <Text className={`text-[12px] font-outfit-sb ${tone.text}`}>{l.label}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ── Campus Info ── */}
        {user.campus && (user.campus.department || user.campus.course || user.campus.year) && (
          <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none mb-4">
            <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Campus Info</Text>

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

        {/* ── Reputation & Seller Verification (user only) ── */}
        {!editMode && user.role === "user" && (
          <>
            {reputationData && (
              <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none mb-4">
                <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Reputation</Text>
                <View className="flex-row flex-wrap gap-3 mb-3">
                  {[
                    { label: "Score", value: `${reputationData.score}/100` },
                    { label: "Completion", value: `${reputationData.completionRate}%` },
                    { label: "Rating", value: `${reputationData.averageRating} ★` },
                    { label: "Orders", value: String(reputationData.totalOrders) },
                  ].map((m) => (
                    <View key={m.label} className="flex-1 min-w-[40%] rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3">
                      <Text className="text-[20px] font-outfit-bl text-slate-900 dark:text-white">{m.value}</Text>
                      <Text className="text-[11px] font-outfit-m text-slate-500 dark:text-slate-400">{m.label}</Text>
                    </View>
                  ))}
                </View>
                {(reputationData.trustLabels || []).length > 0 && (
                  <View className="flex-row flex-wrap gap-2">
                    {(reputationData.trustLabels as string[]).map((label) => (
                      <View key={label} className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-900/40">
                        <Text className="text-[11px] font-outfit-sb text-emerald-700 dark:text-emerald-300">{label}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest">Seller Verification</Text>
                {verificationData?.sellerVerificationStatus === "verified" && (
                  <View className="bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                    <Text className="text-[11px] font-outfit-b text-emerald-600 dark:text-emerald-400">✓ Verified</Text>
                  </View>
                )}
                {verificationData?.sellerVerificationStatus === "pending" && (
                  <View className="bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                    <Text className="text-[11px] font-outfit-b text-amber-600 dark:text-amber-400">Pending</Text>
                  </View>
                )}
              </View>
              {(!verificationData?.sellerVerificationStatus || verificationData?.sellerVerificationStatus === "none" || verificationData?.sellerVerificationStatus === "rejected") && (
                <>
                  <Text className="text-[13px] font-outfit text-slate-500 dark:text-slate-400 mb-3">
                    Get a verified badge to build buyer trust. Requires 5+ orders, 4.0+ rating, and 80%+ completion rate.
                  </Text>
                  {verificationData?.sellerVerificationStatus === "rejected" && (
                    <Text className="text-[12px] font-outfit-m text-red-500 mb-2">
                      Rejected: {verificationData?.sellerVerificationReason || "See admin for details"}
                    </Text>
                  )}
                  <Button
                    title={verificationMutation.isPending ? "Submitting..." : "Request Verification"}
                    onPress={() => verificationMutation.mutate()}
                    loading={verificationMutation.isPending}
                    variant="outline"
                  />
                </>
              )}
              {verificationData?.sellerVerificationStatus === "verified" && (
                <Text className="text-[13px] font-outfit text-emerald-600 dark:text-emerald-400">
                  Your seller account is verified. Buyers can trust your listings.
                </Text>
              )}
              {verificationData?.sellerVerificationStatus === "pending" && (
                <Text className="text-[13px] font-outfit text-slate-500 dark:text-slate-400">
                  Your request is under review. We&apos;ll notify you once it&apos;s processed.
                </Text>
              )}
            </View>
          </>
        )}

        {/* ── Account ── */}
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

        {/* ── Account ── */}
        <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-5 mb-2 ml-1">Account</Text>
        <SectionCard>
          <SettingRow href="/wishlist" title="My Wishlist" icon="heart-outline" iconColor="#e11d48" iconBg="bg-red-50 dark:bg-red-950/30" />
          <SettingRow href="/(tabs)/orders" title="My Orders" icon="receipt-outline" iconColor="#6366f1" iconBg="bg-indigo-50 dark:bg-indigo-950/30" />
          <SettingRow href="/notifications" title="Notifications" icon="notifications-outline" iconColor="#6366f1" iconBg="bg-indigo-50 dark:bg-indigo-950/30" />
          <SettingRow href="/notification-preferences" title="Notification Preferences" icon="options-outline" iconColor="#0891b2" iconBg="bg-cyan-50 dark:bg-cyan-950/30" />
          <SettingRow href="/devices" title="Active Devices" icon="phone-portrait-outline" iconColor="#7c3aed" iconBg="bg-violet-50 dark:bg-violet-950/30" />
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
              const doLogout = async () => {
                await logout();
                router.replace("/" as never);
              };

              if (Platform.OS === "web" && typeof window !== "undefined") {
                const yes = window.confirm("Are you sure you want to sign out?");
                if (!yes) return;
                await doLogout();
                return;
              }

              Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                { text: "Cancel", style: "cancel" },
                { text: "Sign Out", style: "destructive", onPress: () => { void doLogout(); } },
              ]);
            }}
          />
        </SectionCard>

        <View className="h-4" />
      </ScrollView>
    </Screen>
  );
}
