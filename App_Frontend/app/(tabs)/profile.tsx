import { Link, router } from "expo-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useColorScheme } from "nativewind";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { getUserProfile, uploadUserAvatar, getMyReputation, getMySellerVerification, requestSellerVerification } from "../../lib/api/users";

type TrustLabel = { key: string; label: string; color: string };
type TrustSignals = {
  profileCompletionScore: number;
  trustLabels: TrustLabel[];
  phoneVerified: boolean;
};

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
  const {
    user,
    loading,
    logout,
    updateProfile,
    sendPhoneVerificationOtp,
    confirmPhoneVerificationOtp,
    refreshUser: refreshAuthUser,
  } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [editLocation, setEditLocation] = useState(user?.location || "");
  const [editProfileRole, setEditProfileRole] = useState(user?.profileRole || "");
  const [editCampus, setEditCampus] = useState({
    collegeName: user?.campus?.collegeName || "",
    department: user?.campus?.department || "",
    course: user?.campus?.course || "",
    year: user?.campus?.year || "",
    semester: user?.campus?.semester || "",
    enrollmentId: user?.campus?.enrollmentId || "",
    hostel: user?.campus?.hostel || "",
    residentType: user?.campus?.residentType || "",
  });
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

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

  const queryClient = useQueryClient();
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

  const sendOtp = async () => {
    if (otpSending) return;
    setOtpSending(true);
    try {
      const res = await sendPhoneVerificationOtp();
      if (!res.success) {
        Alert.alert("OTP failed", res.message || "Could not send OTP.");
        return;
      }
      Alert.alert("OTP sent", "Please check your phone for the verification code.");
    } catch {
      Alert.alert("OTP failed", "Could not send OTP.");
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtp = async () => {
    if (otpVerifying) return;
    if (!otpCode.trim()) {
      Alert.alert("OTP required", "Enter the code you received.");
      return;
    }
    setOtpVerifying(true);
    try {
      const res = await confirmPhoneVerificationOtp(otpCode.trim());
      if (!res.success) {
        Alert.alert("Verification failed", res.message || "Could not verify OTP.");
        return;
      }
      setOtpCode("");
      await refetchTrust();
      Alert.alert("Verified", "Phone number verified successfully.");
    } catch {
      Alert.alert("Verification failed", "Could not verify OTP.");
    } finally {
      setOtpVerifying(false);
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
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* ── Avatar & Name ── */}
        <View className="items-center rounded-3xl bg-white dark:bg-slate-900 px-6 py-8 shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 mb-4">
          <Pressable onPress={pickAndUploadAvatar} className="mb-4 active:opacity-80" disabled={avatarUploading}>
            <View className="h-24 w-24 rounded-full bg-primary-100 dark:bg-primary-900 border-4 border-primary-50 dark:border-primary-950/60 items-center justify-center overflow-hidden">
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ width: 96, height: 96 }} contentFit="cover" />
              ) : (
                <Text className="text-3xl font-outfit-bl text-primary-600 dark:text-primary-400">{userInitials}</Text>
              )}
              <View className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-slate-900/80 items-center justify-center border-2 border-white/40">
                <Ionicons name="camera" size={15} color="#fff" />
              </View>
            </View>
          </Pressable>
          <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400 mb-1">
            {avatarUploading ? "Uploading photo..." : "Tap to change photo"}
          </Text>

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
              <TextInput
                value={editProfileRole}
                onChangeText={setEditProfileRole}
                className="text-center text-[14px] font-outfit text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4"
                placeholder="Profile role (optional)"
                placeholderTextColor="#94a3b8"
              />

              <View className="mb-2">
                <Text className="text-[12px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">
                  Campus
                </Text>
              </View>
              <TextInput
                value={editCampus.collegeName}
                onChangeText={(t) => setEditCampus((p) => ({ ...p, collegeName: t }))}
                className="text-center text-[14px] font-outfit text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3"
                placeholder="College name"
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                value={editCampus.department}
                onChangeText={(t) => setEditCampus((p) => ({ ...p, department: t }))}
                className="text-center text-[14px] font-outfit text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3"
                placeholder="Department"
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                value={editCampus.course}
                onChangeText={(t) => setEditCampus((p) => ({ ...p, course: t }))}
                className="text-center text-[14px] font-outfit text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3"
                placeholder="Course"
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                value={editCampus.year}
                onChangeText={(t) => setEditCampus((p) => ({ ...p, year: t }))}
                className="text-center text-[14px] font-outfit text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3"
                placeholder="Year"
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                value={editCampus.semester}
                onChangeText={(t) => setEditCampus((p) => ({ ...p, semester: t }))}
                className="text-center text-[14px] font-outfit text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3"
                placeholder="Semester"
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                value={editCampus.enrollmentId}
                onChangeText={(t) => setEditCampus((p) => ({ ...p, enrollmentId: t }))}
                className="text-center text-[14px] font-outfit text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3"
                placeholder="Enrollment ID"
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                value={editCampus.hostel}
                onChangeText={(t) => setEditCampus((p) => ({ ...p, hostel: t }))}
                className="text-center text-[14px] font-outfit text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3"
                placeholder="Hostel"
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                value={editCampus.residentType}
                onChangeText={(t) => setEditCampus((p) => ({ ...p, residentType: t }))}
                className="text-center text-[14px] font-outfit text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4"
                placeholder="Resident type"
                placeholderTextColor="#94a3b8"
              />
              <View className="flex-row gap-3">
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
                        collegeName: user.campus?.collegeName || "",
                        department: user.campus?.department || "",
                        course: user.campus?.course || "",
                        year: user.campus?.year || "",
                        semester: user.campus?.semester || "",
                        enrollmentId: user.campus?.enrollmentId || "",
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
                onPress={() => {
                  setEditName(user.name || "");
                  setEditPhone(user.phone || "");
                  setEditLocation(user.location || "");
                  setEditProfileRole(user.profileRole || "");
                  setEditCampus({
                    collegeName: user.campus?.collegeName || "",
                    department: user.campus?.department || "",
                    course: user.campus?.course || "",
                    year: user.campus?.year || "",
                    semester: user.campus?.semester || "",
                    enrollmentId: user.campus?.enrollmentId || "",
                    hostel: user.campus?.hostel || "",
                    residentType: user.campus?.residentType || "",
                  });
                  setEditMode(true);
                }}
                className="mt-4 flex-row items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 active:bg-slate-200"
              >
                <Ionicons name="create-outline" size={14} color="#64748b" />
                <Text className="text-[13px] font-outfit-sb text-slate-600 dark:text-slate-300">Edit Profile</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* ── Trust / Profile Progress ── */}
        {!editMode && (
          <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none mb-4">
            <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
              Profile & Trust
            </Text>

            {profileTrustLoading ? (
              <Text className="text-[13px] font-outfit text-slate-500 dark:text-slate-400">Loading trust signals...</Text>
            ) : profileTrustError ? (
              <Text className="text-[13px] font-outfit text-red-500">Could not load trust signals.</Text>
            ) : (
              <>
                <View className="mb-3">
                  <Text className="text-[14px] font-outfit-m text-slate-800 dark:text-slate-200">
                    Completion: {trustSignals?.profileCompletionScore ?? 0}%
                  </Text>
                  <View className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <View
                      className="h-2 rounded-full bg-primary-600"
                      style={{
                        width: `${Math.max(0, Math.min(100, trustSignals?.profileCompletionScore ?? 0))}%`,
                      }}
                    />
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-2 mb-4">
                  {(trustSignals?.trustLabels || []).map((l) => {
                    const tone = toneForLabelColor(l.color);
                    return (
                      <View key={l.key} className={`px-3 py-1 rounded-full ${tone.bg}`}>
                        <Text className={`text-[12px] font-outfit-sb ${tone.text}`}>{l.label}</Text>
                      </View>
                    );
                  })}
                  {(trustSignals?.trustLabels || []).length === 0 ? (
                    <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400">No trust labels yet.</Text>
                  ) : null}
                </View>

                {!trustSignals?.phoneVerified ? (
                  <View>
                    <Text className="text-[13px] font-outfit-sb text-slate-800 dark:text-slate-200 mb-2">
                      Phone verification required
                    </Text>

                    <View className="mb-3">
                      <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400 mb-1">OTP</Text>
                      <TextInput
                        value={otpCode}
                        onChangeText={setOtpCode}
                        keyboardType="numeric"
                        placeholder="Enter code"
                        placeholderTextColor="#94a3b8"
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white"
                      />
                    </View>

                    <View className="flex-row gap-3 mb-1">
                      <View className="flex-1">
                        <Button
                          title={otpSending ? "Sending..." : "Send OTP"}
                          onPress={sendOtp}
                          loading={otpSending}
                          variant="outline"
                        />
                      </View>
                      <View className="flex-1">
                        <Button
                          title={otpVerifying ? "Verifying..." : "Verify Phone"}
                          onPress={verifyOtp}
                          loading={otpVerifying}
                          disabled={!otpCode.trim()}
                        />
                      </View>
                    </View>

                    <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400">
                      OTP is required to unlock trust-based actions.
                    </Text>
                  </View>
                ) : (
                  <View>
                    <Text className="text-[13px] font-outfit-sb text-emerald-700 dark:text-emerald-200">Phone verified</Text>
                    <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400 mt-1">
                      Your phone number is verified.
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

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
                  Your request is under review. We'll notify you once it's processed.
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
