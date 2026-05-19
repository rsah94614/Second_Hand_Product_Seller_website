import { useMutation } from "@tanstack/react-query";
import { useGlobalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TextInput, View, Pressable, InteractionManager, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { KeyboardShiftView } from "../../components/ui/KeyboardShiftView";
import { useAuth } from "../../context/AuthContext";
import { submitSellerReview } from "../../lib/api/users";
import { parseApiError, formatErrorForDisplay } from "../../lib/utils/errorHandler";
import { useToast } from "../../components/ui/AppToast";

export default function ReviewSellerScreen() {
  const [ready, setReady] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setReady(true);
    });
    return () => task.cancel();
  }, []);

  useEffect(() => {
    if (ready && !authLoading && !user) {
      router.replace("/(auth)/login");
    }
  }, [ready, authLoading, user]);

  if (!ready || authLoading || !user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#020617" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return <ReviewSellerContent />;
}

function StarRating({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  return (
    <View className="flex-row items-center gap-2 my-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange(star)}
          hitSlop={8}
          className="active:scale-125"
        >
          <Ionicons
            name={rating >= star ? "star" : "star-outline"}
            size={38}
            color={rating >= star ? "#f59e0b" : "#cbd5e1"}
          />
        </Pressable>
      ))}
    </View>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Excellent!",
};

function ReviewSellerContent() {
  const { sellerId, orderId } = useGlobalSearchParams<{ sellerId: string; orderId?: string }>();
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      submitSellerReview(String(sellerId), {
        orderId: String(orderId || ""),
        rating,
        comment: comment.trim(),
    }),
    onSuccess: () => {
      showToast("Review submitted. Thank you! 🎉");
      router.back();
    },
    onError: (e: any) => {
      const parsed = parseApiError(e, "Could not submit review.");
      Alert.alert("Error", formatErrorForDisplay(parsed));
    },
  });

  if (!sellerId || !orderId) {
    return (
      <Screen safeAreaTop={false}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-900/30 items-center justify-center mb-4">
            <Ionicons name="alert-circle-outline" size={32} color="#ef4444" />
          </View>
          <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white text-center mb-2">
            Missing Order Info
          </Text>
          <Text className="text-[14px] font-outfit text-slate-500 dark:text-slate-400 text-center">
            This review link is missing order details. Please go back and try again.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 px-6 py-3 rounded-2xl bg-primary-600 active:bg-primary-700"
          >
            <Text className="text-white font-outfit-sb text-[15px]">Go Back</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950" safeAreaTop={false} safeAreaBottom={false}>
      <KeyboardShiftView>
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-6 pt-2">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 items-center justify-center active:bg-slate-50"
            >
              <Ionicons name="arrow-back" size={20} color="#64748b" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-[24px] font-outfit-bl text-slate-900 dark:text-white leading-tight">Rate Seller</Text>
            </View>
          </View>

          {/* Rating Card */}
          <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm shadow-slate-200/50 dark:shadow-none mb-4">
            <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
              Your experience
            </Text>
            <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white mb-4">
              How was your deal?
            </Text>

            {/* Stars */}
            <View className="items-center py-4">
              <StarRating rating={rating} onChange={setRating} />
              {rating > 0 && (
                <Text className="mt-3 text-[16px] font-outfit-sb text-amber-500 dark:text-amber-400">
                  {RATING_LABELS[rating]}
                </Text>
              )}
            </View>

            {/* Rating chips */}
            <View className="flex-row flex-wrap gap-2 mt-2">
              {["Quick response", "Item as described", "Easy pickup", "Great communication", "Fair price"].map((tag) => {
                const selected = comment.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => {
                      if (selected) {
                        setComment((prev) => prev.replace(tag, "").replace(/^[,\s]+|[,\s]+$/g, "").trim());
                      } else {
                        setComment((prev) => prev ? `${prev}, ${tag}` : tag);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full border text-[12px] ${
                      selected
                        ? "bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Text className={`text-[12px] font-outfit-m ${selected ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Comment Card */}
          <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm shadow-slate-200/50 dark:shadow-none mb-6">
            <Text className="text-[13px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
              Add a comment (optional)
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Share more about your experience..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={600}
              className="min-h-[100px] text-[15px] font-outfit text-slate-900 dark:text-white leading-relaxed"
              style={{ textAlignVertical: "top" }}
            />
            <Text className="text-right text-[11px] font-outfit text-slate-400 mt-2">
              {comment.length}/600
            </Text>
          </View>

          {/* Submit */}
          <Button
            title={mutation.isPending ? "Submitting..." : "Submit Review"}
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
          />
          <View className="h-10" />
        </ScrollView>
      </KeyboardShiftView>
    </Screen>
  );
}
