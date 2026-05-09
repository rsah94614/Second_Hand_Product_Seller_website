import React from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../ui/Button";

type Props = {
  reviews: any[];
  canReview: boolean;
  reviewForm: { rating: number; comment: string };
  setReviewForm: React.Dispatch<React.SetStateAction<{ rating: number; comment: string }>>;
  onSubmitReview: () => void;
  isSubmitting: boolean;
  currentUserId?: string;
};

export function ReviewSection({
  reviews,
  canReview,
  reviewForm,
  setReviewForm,
  onSubmitReview,
  isSubmitting,
  currentUserId,
}: Props) {
  return (
    <View className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
      <Text className="text-[18px] font-outfit-b text-slate-900 dark:text-white mb-4">Seller Reviews</Text>

      {canReview ? (
        <View className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm mb-6">
          <Text className="text-[15px] font-outfit-sb text-slate-900 dark:text-white mb-3">Rate your experience</Text>
          <View className="flex-row gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <Pressable key={s} onPress={() => setReviewForm((f) => ({ ...f, rating: s }))} className="p-1">
                <Ionicons name={reviewForm.rating >= s ? "star" : "star-outline"} size={28} color="#fbbf24" />
              </Pressable>
            ))}
          </View>
          <TextInput
            value={reviewForm.comment}
            onChangeText={(t) => setReviewForm((f) => ({ ...f, comment: t }))}
            placeholder="Write your review..."
            placeholderTextColor="#94a3b8"
            multiline
            className="min-h-[80px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-[15px] font-outfit text-slate-900 dark:text-white mb-4"
            textAlignVertical="top"
          />
          <Button title="Submit Review" loading={isSubmitting} onPress={onSubmitReview} />
        </View>
      ) : (
        <View className="mb-6 p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
          <Text className="text-[13px] font-outfit text-slate-500 dark:text-slate-400 text-center">
            You can only review a seller after completing a deal with them.
          </Text>
        </View>
      )}

      {reviews.length > 0 && (
        <View className="gap-3">
          {reviews.map((r) => (
            <View key={r._id} className="mb-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <View className="flex-row items-center mb-1">
                <Ionicons name="star" size={16} color="#fbbf24" />
                <Text className="ml-1 font-outfit-sb text-slate-700 dark:text-slate-300">{r.rating}</Text>
              </View>
              {r.user?.name ? (
                <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400">{r.user.name}</Text>
              ) : null}
              <Text className="mt-1 text-[14px] font-outfit text-slate-600 dark:text-slate-400 leading-snug">{r.comment}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
