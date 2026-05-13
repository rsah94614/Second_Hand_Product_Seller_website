import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Loading } from "../../components/Loading";
import { EmptyState } from "../../components/EmptyState";
import {
  getSellerVerifications,
  approveSellerVerification,
  rejectSellerVerification,
} from "../../lib/api/admin";
import { Ionicons } from "@expo/vector-icons";

type VerificationUser = {
  _id: string;
  name: string;
  email: string;
  averageRating?: number;
  reviewCount?: number;
  sellerVerificationStatus: string;
  sellerVerificationRequestedAt?: string;
  sellerVerificationReason?: string;
};

const statusColor = (s: string) => {
  if (s === "verified") return { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400" };
  if (s === "rejected") return { bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-600 dark:text-red-400" };
  return { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400" };
};

export default function AdminSellerVerificationsScreen() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-seller-verifications", statusFilter],
    queryFn: () => getSellerVerifications(statusFilter),
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => approveSellerVerification(userId),
    onSuccess: () => {
      Alert.alert("Approved", "Seller verification approved.");
      queryClient.invalidateQueries({ queryKey: ["admin-seller-verifications"] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert("Error", msg || "Failed to approve.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      rejectSellerVerification(userId, { reason }),
    onSuccess: () => {
      Alert.alert("Rejected", "Seller verification rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin-seller-verifications"] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert("Error", msg || "Failed to reject.");
    },
  });

  const users: VerificationUser[] = data?.users || [];

  const FILTERS = [
    { label: "Pending", value: "pending" },
    { label: "Verified", value: "verified" },
    { label: "Rejected", value: "rejected" },
  ];

  if (isLoading && !data) {
    return <Screen><Loading /></Screen>;
  }

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950" safeAreaTop={false}>
      {/* Filter tabs */}
      <View className="flex-row gap-2 px-4 pt-4 pb-3">
        {FILTERS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setStatusFilter(f.value)}
            className={`flex-1 py-2 rounded-full border items-center ${statusFilter === f.value ? "bg-primary-600 border-primary-600" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"}`}
          >
            <Text className={`text-[13px] font-outfit-sb ${statusFilter === f.value ? "text-white" : "text-slate-700 dark:text-slate-300"}`}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={users}
        keyExtractor={(u) => u._id}
        refreshing={isRefetching}
        onRefresh={refetch}
        contentContainerStyle={{ padding: 16, paddingTop: 4, flexGrow: 1 }}
        ListEmptyComponent={
          <View className="py-20">
            <EmptyState title="No requests" message={`No ${statusFilter} verification requests.`} />
          </View>
        }
        renderItem={({ item: u }) => {
          const sc = statusColor(u.sellerVerificationStatus);
          const initials = u.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
          return (
            <View className="mb-3 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm shadow-slate-200/50 dark:shadow-none">
              <View className="flex-row items-center gap-3 mb-3">
                <View className="h-11 w-11 rounded-full bg-primary-100 dark:bg-primary-900/60 items-center justify-center">
                  <Text className="text-[15px] font-outfit-b text-primary-700 dark:text-primary-300">{initials}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] font-outfit-sb text-slate-900 dark:text-white">{u.name}</Text>
                  <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400">{u.email}</Text>
                </View>
                <View className={`px-2.5 py-1 rounded-full ${sc.bg}`}>
                  <Text className={`text-[10px] font-outfit-b uppercase tracking-wider ${sc.text}`}>{u.sellerVerificationStatus}</Text>
                </View>
              </View>

              <View className="flex-row gap-4 mb-3">
                <View>
                  <Text className="text-[10px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rating</Text>
                  <Text className="text-[14px] font-outfit-sb text-slate-800 dark:text-slate-200 mt-0.5">
                    {u.averageRating?.toFixed(1) || "—"} ★
                  </Text>
                </View>
                <View>
                  <Text className="text-[10px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reviews</Text>
                  <Text className="text-[14px] font-outfit-sb text-slate-800 dark:text-slate-200 mt-0.5">{u.reviewCount ?? 0}</Text>
                </View>
                {u.sellerVerificationRequestedAt && (
                  <View>
                    <Text className="text-[10px] font-outfit-sb text-slate-500 dark:text-slate-400 uppercase tracking-wider">Requested</Text>
                    <Text className="text-[14px] font-outfit-sb text-slate-800 dark:text-slate-200 mt-0.5">
                      {new Date(u.sellerVerificationRequestedAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              {u.sellerVerificationStatus === "pending" && (
                <View className="gap-2">
                  <Pressable
                    onPress={() => {
                      Alert.alert("Approve", `Approve seller verification for ${u.name}?`, [
                        { text: "Cancel", style: "cancel" },
                        { text: "Approve", onPress: () => approveMutation.mutate(u._id) },
                      ]);
                    }}
                    disabled={approveMutation.isPending}
                    className="rounded-xl bg-emerald-600 px-4 py-3 items-center"
                  >
                    <Text className="text-[14px] font-outfit-sb text-white">Approve</Text>
                  </Pressable>
                  <View className="flex-row gap-2">
                    <TextInput
                      value={rejectionReasons[u._id] || ""}
                      onChangeText={(t) => setRejectionReasons((p) => ({ ...p, [u._id]: t }))}
                      placeholder="Rejection reason..."
                      placeholderTextColor="#94a3b8"
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-[14px] font-outfit text-slate-900 dark:text-white"
                    />
                    <Pressable
                      onPress={() => {
                        const reason = rejectionReasons[u._id]?.trim();
                        if (!reason) { Alert.alert("Required", "Enter a rejection reason."); return; }
                        rejectMutation.mutate({ userId: u._id, reason });
                      }}
                      disabled={rejectMutation.isPending}
                      className="rounded-xl bg-red-50 dark:bg-red-950/30 px-4 py-2.5 items-center justify-center"
                    >
                      <Ionicons name="close" size={18} color="#dc2626" />
                    </Pressable>
                  </View>
                </View>
              )}

              {u.sellerVerificationStatus === "rejected" && u.sellerVerificationReason && (
                <View className="rounded-xl bg-red-50 dark:bg-red-950/30 p-3">
                  <Text className="text-[11px] font-outfit-sb text-red-700 dark:text-red-400 uppercase tracking-wider mb-1">Rejection Reason</Text>
                  <Text className="text-[13px] font-outfit text-red-800 dark:text-red-300">{u.sellerVerificationReason}</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </Screen>
  );
}
