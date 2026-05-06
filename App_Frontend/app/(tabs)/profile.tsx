import { router } from "expo-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Alert, Platform, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import * as ImagePicker from "expo-image-picker";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { saveThemePreference } from "../../lib/theme-storage";
import { getUserProfile, uploadUserAvatar, getMyReputation, getMySellerVerification, requestSellerVerification, getProfileCompletion } from "../../lib/api/users";
import { parseApiError, formatErrorForDisplay } from "../../lib/utils/errorHandler";

// Modular Views
import UserProfileView from "../../components/profile/UserProfileView";
import AdminProfileView from "../../components/profile/AdminProfileView";

interface CampusInfo {
  department: string;
  course: string;
  year: string;
  semester: string;
  hostel: string;
  residentType: string;
}

export default function ProfileScreen() {
  const {
    user,
    loading,
    logout,
    updateProfile,
    refreshUser: refreshAuthUser,
  } = useAuth();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editLocation, setEditLocation] = useState(user?.location || "");
  const [editProfileRole, setEditProfileRole] = useState(user?.profileRole || "");

  const handleToggleTheme = async () => {
    const next = colorScheme === "dark" ? "light" : "dark";
    toggleColorScheme();
    await saveThemePreference(next);
  };

  const [editCampus, setEditCampus] = useState<CampusInfo>({
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
  } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: () => getUserProfile(user!.id),
    enabled: !!user?.id,
  });

  const {
    data: completionData,
    refetch: refetchCompletion,
  } = useQuery({
    queryKey: ["profile-completion"],
    queryFn: getProfileCompletion,
    enabled: !!user?.id && user?.role !== 'admin',
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
    onError: (e: any) => {
      const parsedError = parseApiError(e, "Could not submit verification request.");
      Alert.alert("Error", formatErrorForDisplay(parsedError));
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
        location: editLocation.trim(),
        profileRole: editProfileRole.trim(),
        campus: { ...editCampus },
      });
      setEditMode(false);
      await refetchTrust();
      if (user?.role !== 'admin') await refetchCompletion();
    } catch (e: any) {
      const parsedError = parseApiError(e, "Could not update profile. Please try again.");
      Alert.alert("Error", formatErrorForDisplay(parsedError));
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
  const avatarUri = (profileData?.user?.avatar || user.avatar || "").toString();

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
    } catch (e: any) {
      const parsedError = parseApiError(e, "Could not upload profile photo.");
      Alert.alert("Upload failed", formatErrorForDisplay(parsedError));
    } finally {
      setAvatarUploading(false);
    }
  };

  const toneForLabelColor = (c?: string) => {
    switch (c) {
      case "green": return { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-200" };
      case "blue": return { bg: "bg-indigo-50 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-200" };
      case "amber": return { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-200" };
      case "purple": return { bg: "bg-violet-50 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-200" };
      default: return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300" };
    }
  };

  const commonProps = {
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
    logout: async () => {
       await logout();
       router.replace("/");
    },
    router,
  };

  return (
    <Screen>
      <PageHeader title="My Profile" subtitle={user?.email} />
      {user.role === 'admin' ? (
        <AdminProfileView {...commonProps} />
      ) : (
        <UserProfileView
          {...commonProps}
          profileData={profileData}
          trustSignals={profileData?.trustSignals}
          completionData={completionData}
          reputationData={reputationData}
          verificationData={verificationData}
          editProfileRole={editProfileRole}
          setEditProfileRole={setEditProfileRole}
          editCampus={editCampus}
          setEditCampus={setEditCampus}
          showTradingInfo={showTradingInfo}
          setShowTradingInfo={setShowTradingInfo}
          verificationMutation={verificationMutation}
          toneForLabelColor={toneForLabelColor}
        />
      )}
    </Screen>
  );
}
