import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "../../../components/ui/Screen";
import { Button } from "../../../components/ui/Button";
import { Loading } from "../../../components/Loading";
import { Ionicons } from "@expo/vector-icons";
import {
  getAdminDisputeById,
  rejectAdminDispute,
  resolveAdminDispute,
} from "../../../lib/api/admin";

export default function AdminDisputeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [adminNotes, setAdminNotes] = useState("");
  const [resolution, setResolution] = useState("");

  const { data: dispute, isLoading } = useQuery({
    queryKey: ["admin-dispute", id],
    queryFn: () => getAdminDisputeById(id as string),
  });

  const resolveM = useMutation({
    mutationFn: (payload: any) => resolveAdminDispute(id as string, payload),
    onSuccess: () => {
      Alert.alert("Success", "Dispute resolved successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dispute", id] });
      router.back();
    },
    onError: (err: any) => Alert.alert("Error", err.response?.data?.message || "Failed to resolve"),
  });

  const rejectM = useMutation({
    mutationFn: (payload: any) => rejectAdminDispute(id as string, payload),
    onSuccess: () => {
      Alert.alert("Success", "Dispute rejected successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dispute", id] });
      router.back();
    },
    onError: (err: any) => Alert.alert("Error", err.response?.data?.message || "Failed to reject"),
  });

  const handleResolve = () => {
    if (!adminNotes.trim()) return Alert.alert("Required", "Admin Notes are required.");
    if (!resolution.trim()) return Alert.alert("Required", "Resolution description is required.");
    resolveM.mutate({ adminNotes, resolution });
  };

  const handleReject = () => {
    if (!adminNotes.trim()) return Alert.alert("Required", "Admin Notes are required.");
    if (!resolution.trim()) return Alert.alert("Required", "Rejection reason is required.");
    rejectM.mutate({ adminNotes, reason: resolution });
  };

  if (isLoading || !dispute) return <Screen><Loading /></Screen>;

  const isOpen = dispute.status === "open" || dispute.status === "under_review";

  let bgClass = "bg-amber-100 dark:bg-amber-900/30";
  let textClass = "text-amber-700 dark:text-amber-400";
  if (dispute.status === "resolved") {
    bgClass = "bg-green-100 dark:bg-green-900/30";
    textClass = "text-green-700 dark:text-green-400";
  } else if (dispute.status === "rejected") {
    bgClass = "bg-red-100 dark:bg-red-900/30";
    textClass = "text-red-700 dark:text-red-400";
  }

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950" safeAreaTop={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-10" showsVerticalScrollIndicator={false}>
          {/* Header Info */}
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 mb-4">
            <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <View>
                <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400">Order ID</Text>
                <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white mt-1">#{dispute.order?._id}</Text>
              </View>
              <View className={`px-3 py-1.5 rounded-lg ${bgClass}`}>
                <Text className={`text-[12px] font-outfit-sb uppercase ${textClass}`}>
                  {dispute.status}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center mb-4">
              <View className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-full items-center justify-center mr-3">
                <Ionicons name="person" size={18} color="#64748b" />
              </View>
              <View>
                <Text className="text-[14px] font-outfit-sb text-slate-900 dark:text-white">
                  {dispute.initiatedBy?.name || "Unknown User"}
                </Text>
                <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400">
                  {dispute.initiatedBy?.email || "No email"}
                </Text>
              </View>
            </View>

            <View>
              <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400 mb-1">Reason</Text>
              <Text className="text-[15px] font-outfit-sb text-slate-900 dark:text-white capitalize">
                {dispute.reason?.replace(/_/g, " ")}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 mb-4">
            <Text className="text-[14px] font-outfit-sb text-slate-900 dark:text-white mb-2">Description</Text>
            <Text className="text-[14px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed">
              {dispute.description || "No description provided."}
            </Text>
          </View>

          {/* Evidence */}
          {dispute.evidence && dispute.evidence.length > 0 && (
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 mb-4">
              <Text className="text-[14px] font-outfit-sb text-slate-900 dark:text-white mb-3">Evidence Provided</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {dispute.evidence.map((url: string, idx: number) => (
                  <Image
                    key={idx}
                    source={{ uri: url }}
                    className="w-32 h-32 rounded-xl mr-3 bg-slate-100 dark:bg-slate-800"
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Admin Action Area */}
          {isOpen ? (
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 mt-2">
              <Text className="text-[16px] font-outfit-bl text-slate-900 dark:text-white mb-4">Moderation Action</Text>

              <View className="mb-4">
                <Text className="text-[13px] font-outfit-m text-slate-700 dark:text-slate-300 mb-2">Admin Notes (Internal)</Text>
                <TextInput
                  value={adminNotes}
                  onChangeText={setAdminNotes}
                  placeholder="Private investigation notes..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  textAlignVertical="top"
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-[14px] font-outfit text-slate-900 dark:text-white min-h-[100px]"
                />
              </View>

              <View className="mb-6">
                <Text className="text-[13px] font-outfit-m text-slate-700 dark:text-slate-300 mb-2">Resolution / Rejection Reason</Text>
                <TextInput
                  value={resolution}
                  onChangeText={setResolution}
                  placeholder="Explanation shown to the user..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  textAlignVertical="top"
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-[14px] font-outfit text-slate-900 dark:text-white min-h-[100px]"
                />
              </View>

              <View className="flex-col gap-3">
                <Button
                  title="Resolve in Favor of User"
                  onPress={handleResolve}
                  loading={resolveM.isPending}
                  disabled={rejectM.isPending}
                  variant="primary"
                />
                <Button
                  title="Reject Dispute"
                  onPress={handleReject}
                  loading={rejectM.isPending}
                  disabled={resolveM.isPending}
                  variant="outline"
                  className="border-red-500"
                />
              </View>
            </View>
          ) : (
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 mt-2">
              <Text className="text-[14px] font-outfit-sb text-slate-900 dark:text-white mb-3">Moderation Details</Text>
              <View className="mb-4">
                <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400 mb-1">Admin Notes</Text>
                <Text className="text-[14px] font-outfit text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                  {dispute.adminNotes || "N/A"}
                </Text>
              </View>
              <View>
                <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400 mb-1">Resolution Provided</Text>
                <Text className="text-[14px] font-outfit text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                  {dispute.resolution || "N/A"}
                </Text>
              </View>
            </View>
          )}
          <View className="h-10" />
          <View className="h-20" />
          <View className="h-20" />
          <View className="h-20" />
          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
