import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type Props = {
  seller: any;
  currentUserId?: string;
  canTrade: boolean;
};

export function SellerSection({ seller, currentUserId, canTrade }: Props) {
  if (!seller) return null;

  const sellerId = typeof seller === "object" ? seller._id : seller;
  const sellerName = typeof seller === "object" ? seller.name : "Seller";
  const sellerVerified = typeof seller === "object" ? !!seller.sellerVerified : false;
  const sellerAverageRating = typeof seller === "object" ? Number(seller.averageRating || 0) : 0;
  const sellerReviewCount = typeof seller === "object" ? Number(seller.reviewCount || 0) : 0;

  const handleChat = () => {
    if (!canTrade) {
      Alert.alert(
        "Profile Incomplete",
        "Please complete your profile details (photo, location, campus info) before starting a new chat.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Go to Profile", onPress: () => router.push("/(tabs)/profile") }
        ]
      );
      return;
    }
    router.push(`/chat/${sellerId}?name=${encodeURIComponent(String(sellerName || "Chat"))}` as never);
  };

  return (
    <View className="flex-row items-center gap-3 mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
      <View className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center">
        <Text className="text-lg font-outfit-sb text-primary-600 dark:text-primary-400">
          {sellerName?.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-[12px] font-outfit-m text-slate-500 uppercase tracking-widest">Sold By</Text>
        <View className="flex-row items-center gap-1.5 flex-wrap">
          <Text className="text-[16px] font-outfit-b text-slate-900 dark:text-white">{sellerName}</Text>
          {sellerVerified && (
            <View className="bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-md">
              <Text className="text-[10px] font-outfit-b text-emerald-600 dark:text-emerald-400">✓ Verified</Text>
            </View>
          )}
        </View>
        <View className="mt-1 flex-row items-center gap-1">
          <Ionicons name="star" size={14} color="#fbbf24" />
          <Text className="text-[13px] font-outfit-m text-slate-600 dark:text-slate-300">
            {sellerReviewCount > 0
              ? `${sellerAverageRating.toFixed(1)} (${sellerReviewCount} review${sellerReviewCount === 1 ? "" : "s"})`
              : "No seller reviews yet"}
          </Text>
        </View>
      </View>
      {currentUserId && sellerId !== currentUserId && (
        <Pressable
          onPress={handleChat}
          className="h-10 w-10 rounded-full bg-primary-50 dark:bg-primary-900/40 items-center justify-center active:scale-95"
        >
          <Ionicons name="chatbubbles" size={20} color="#6366f1" />
        </Pressable>
      )}
    </View>
  );
}
