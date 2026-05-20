import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { getUserProfile } from "../../lib/api/users";
import { ProductCard } from "../../components/ProductCard";

const getTrustTone = (color?: string) => {
  switch (color) {
    case "green":
    case "emerald":
      return { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" };
    case "blue":
      return { bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" };
    case "amber":
      return { bg: "bg-amber-50 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" };
    case "purple":
      return { bg: "bg-violet-50 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" };
    default:
      return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300" };
  }
};

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string; name?: string }>();
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();

  const { data, isLoading, error } = useQuery({
    queryKey: ["publicProfile", userId],
    queryFn: () => getUserProfile(userId),
    enabled: !!userId,
  });

  const profile = data?.user;
  const recentProducts: any[] = data?.recentProducts || [];
  const trustSignals = data?.trustSignals || {};

  const isOwnProfile = currentUser?.id === userId || currentUser?.id === profile?._id;

  const initials = profile?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "U";

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "";

  const handleMessage = () => {
    if (!profile) return;
    router.push(`/chat/${userId}?name=${encodeURIComponent(profile.name || "Chat")}` as never);
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }} className="bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <View className="flex-row items-center px-4 h-14 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800">
            <Ionicons name="arrow-back" size={22} color="#64748b" />
          </Pressable>
          <Text className="flex-1 text-center text-[17px] font-outfit-sb text-slate-900 dark:text-white mr-10">Profile</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </View>
    );
  }

  /* ── Error ── */
  if (error || !profile) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }} className="bg-slate-50 dark:bg-slate-950">
        <View className="flex-row items-center px-4 h-14 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800">
            <Ionicons name="arrow-back" size={22} color="#64748b" />
          </Pressable>
          <Text className="flex-1 text-center text-[17px] font-outfit-sb text-slate-900 dark:text-white mr-10">Profile</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-5">
            <Ionicons name="person-outline" size={36} color="#94a3b8" />
          </View>
          <Text className="text-[20px] font-outfit-b text-slate-900 dark:text-white text-center mb-2">Profile Not Found</Text>
          <Text className="text-[14px] font-outfit text-slate-500 dark:text-slate-400 text-center">
            This user&apos;s profile doesn&apos;t exist or has been removed.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top }} className="bg-slate-50 dark:bg-slate-950">
      {/* ── Fixed Header ── */}
      <View className="flex-row items-center px-4 h-14 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800"
        >
          <Ionicons name="arrow-back" size={22} color="#64748b" />
        </Pressable>
        <Text numberOfLines={1} className="flex-1 text-center text-[17px] font-outfit-sb text-slate-900 dark:text-white mr-10">
          {profile.name}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ── */}
        <View className="bg-white dark:bg-slate-900 mb-3">
          {/* Banner */}
          <View className="h-24 bg-primary-600 dark:bg-primary-800" />

          <View className="px-5 pb-6 -mt-12">
            <View className="flex-row items-end justify-between">
              {/* Avatar */}
              <View className="relative">
                {profile.avatar ? (
                  <Image
                    source={{ uri: profile.avatar }}
                    className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900"
                    style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 4, borderColor: "#fff" }}
                  />
                ) : (
                  <View
                    className="w-24 h-24 rounded-full bg-primary-500 items-center justify-center border-4 border-white dark:border-slate-900"
                    style={{ width: 96, height: 96, borderRadius: 48 }}
                  >
                    <Text className="text-[32px] font-outfit-bl text-white">{initials}</Text>
                  </View>
                )}
                {trustSignals?.trustLabels?.some((l: any) => l.key === "verified") && (
                  <View className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-emerald-500 items-center justify-center border-2 border-white dark:border-slate-900">
                    <Ionicons name="shield-checkmark" size={14} color="#fff" />
                  </View>
                )}
              </View>

              {/* Message button (non-owner) */}
              {!isOwnProfile && currentUser && (
                <Pressable
                  onPress={handleMessage}
                  className="flex-row items-center gap-2 px-4 py-2.5 bg-primary-600 rounded-2xl active:bg-primary-700"
                >
                  <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
                  <Text className="text-[14px] font-outfit-b text-white">Message</Text>
                </Pressable>
              )}
            </View>

            {/* Name & Meta */}
            <Text className="text-[22px] font-outfit-bl text-slate-900 dark:text-white mt-3">{profile.name}</Text>
            {profile.location && (
              <View className="flex-row items-center gap-1 mt-1">
                <Ionicons name="location-outline" size={13} color="#94a3b8" />
                <Text className="text-[13px] font-outfit-m text-slate-500 dark:text-slate-400">{profile.location}</Text>
              </View>
            )}
            {memberSince ? (
              <View className="flex-row items-center gap-1 mt-0.5">
                <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                <Text className="text-[12px] font-outfit text-slate-400">Member since {memberSince}</Text>
              </View>
            ) : null}

            {/* Campus Info */}
            {(profile.profileRole || profile.campus?.department) && (
              <View className="flex-row flex-wrap gap-2 mt-3">
                {profile.profileRole ? (
                  <View className="bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full">
                    <Text className="text-[12px] font-outfit-sb text-primary-700 dark:text-primary-300">{profile.profileRole}</Text>
                  </View>
                ) : null}
                {profile.campus?.department ? (
                  <View className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    <Text className="text-[12px] font-outfit-m text-slate-600 dark:text-slate-400">{profile.campus.department}</Text>
                  </View>
                ) : null}
                {profile.campus?.course && profile.campus?.year ? (
                  <View className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    <Text className="text-[12px] font-outfit-m text-slate-600 dark:text-slate-400">
                      {profile.campus.course} · Year {profile.campus.year}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Trust Badges */}
            {trustSignals?.trustLabels?.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mt-3">
                {trustSignals.trustLabels.map((label: any) => {
                  const tone = getTrustTone(label.color);
                  return (
                    <View key={label.key} className={`px-3 py-1 rounded-full ${tone.bg}`}>
                      <Text className={`text-[11px] font-outfit-b uppercase tracking-wider ${tone.text}`}>
                        {label.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* ── Stats Row ── */}
        <View className="flex-row gap-3 px-4 mb-3">
          {[
            { icon: "star", value: trustSignals.averageRating ? Number(trustSignals.averageRating).toFixed(1) : "—", label: "Avg Rating", color: "#f59e0b" },
            { icon: "checkmark-circle", value: trustSignals.completedOrders ?? 0, label: "Completed", color: "#10b981" },
            { icon: "bag-handle", value: recentProducts.length, label: "Listings", color: "#6366f1" },
            { icon: "chatbubble-ellipses", value: trustSignals.reviewCount ?? 0, label: "Reviews", color: "#8b5cf6" },
          ].map((stat) => (
            <View
              key={stat.label}
              className="flex-1 items-center bg-white dark:bg-slate-900 rounded-2xl py-4 border border-slate-100 dark:border-slate-800"
            >
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
              <Text className="text-[16px] font-outfit-bl text-slate-900 dark:text-white mt-1">{String(stat.value)}</Text>
              <Text className="text-[10px] font-outfit-m text-slate-500 dark:text-slate-400 text-center">{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Active Listings ── */}
        {recentProducts.length > 0 && (
          <View className="bg-white dark:bg-slate-900 mx-0 mb-3 px-4 pt-5 pb-4">
            <Text className="text-[17px] font-outfit-b text-slate-900 dark:text-white mb-4">Active Listings</Text>
            <View className="flex-row flex-wrap gap-[10px]">
              {recentProducts.slice(0, 6).map((p: any) => (
                <View key={p._id} className="w-[48%]">
                  <ProductCard product={p} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Reviews ── */}
        {profile.reviews?.length > 0 && (
          <View className="bg-white dark:bg-slate-900 mx-0 mb-3 px-4 pt-5 pb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[17px] font-outfit-b text-slate-900 dark:text-white">Seller Reviews</Text>
              <View className="flex-row items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full">
                <Ionicons name="star" size={12} color="#f59e0b" />
                <Text className="text-[13px] font-outfit-b text-amber-700 dark:text-amber-300">
                  {Number(trustSignals.averageRating || 0).toFixed(1)}
                </Text>
              </View>
            </View>

            <View className="gap-3">
              {profile.reviews.slice(0, 8).map((review: any, idx: number) => (
                <View
                  key={review._id || idx}
                  className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 p-4"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      <View className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 items-center justify-center">
                        <Text className="text-[12px] font-outfit-b text-primary-600 dark:text-primary-400">
                          {review.user?.name?.[0] || "?"}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-[13px] font-outfit-b text-slate-900 dark:text-white">
                          {review.user?.name || "Anonymous"}
                        </Text>
                        <Text className="text-[11px] font-outfit text-slate-400">
                          {new Date(review.updatedAt || review.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                      <Ionicons name="star" size={11} color="#f59e0b" />
                      <Text className="text-[12px] font-outfit-b text-amber-700 dark:text-amber-300">{review.rating}</Text>
                    </View>
                  </View>
                  {review.comment ? (
                    <Text className="text-[13px] font-outfit text-slate-600 dark:text-slate-300 leading-relaxed ml-10">
                      {review.comment}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Empty state ── */}
        {recentProducts.length === 0 && (!profile.reviews || profile.reviews.length === 0) && (
          <View className="items-center py-12 px-6 bg-white dark:bg-slate-900 mx-0">
            <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
              <Ionicons name="bag-handle-outline" size={28} color="#94a3b8" />
            </View>
            <Text className="text-[15px] font-outfit-m text-slate-500 dark:text-slate-400 text-center">
              No listings or reviews yet.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
