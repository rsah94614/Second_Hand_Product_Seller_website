import { useMutation } from "@tanstack/react-query";
import { Redirect, Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { submitSellerReview } from "../../lib/api/users";

export default function ReviewSellerScreen() {
  const { sellerId, orderId } = useLocalSearchParams<{ sellerId: string; orderId?: string }>();
  const { user } = useAuth();
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      submitSellerReview(String(sellerId), {
        orderId: String(orderId || ""),
        rating: Math.min(5, Math.max(1, parseInt(rating, 10) || 5)),
        comment: comment.trim(),
      }),
    onSuccess: () => {
      Alert.alert("Thanks", "Review submitted.", [{ text: "OK", onPress: () => router.back() }]);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert("Error", msg || "Could not submit review.");
    },
  });

  if (!user) return <Redirect href="/(auth)/login" />;
  if (!sellerId || !orderId) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Review seller" }} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[16px] font-outfit-m text-slate-700 dark:text-slate-200 text-center">
            This review link is missing order details.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950">
      <Stack.Screen options={{ title: "Review seller" }} />
      <View className="p-4">
        <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none">
          <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white mb-4">Rate your deal</Text>

          <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400 mb-1">Rating (1-5)</Text>
          <TextInput
            value={rating}
            onChangeText={setRating}
            keyboardType="numeric"
            placeholder="5"
            placeholderTextColor="#94a3b8"
            className="mb-4 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white"
          />

          <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400 mb-1">Comment</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience..."
            placeholderTextColor="#94a3b8"
            multiline
            className="min-h-[120px] mb-4 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white"
            textAlignVertical="top"
          />

          <Button title="Submit review" onPress={() => mutation.mutate()} loading={mutation.isPending} />
        </View>
      </View>
    </Screen>
  );
}

