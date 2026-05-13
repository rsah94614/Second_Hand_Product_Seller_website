import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { bulkSuspendUsers, bulkDeleteProducts } from "../../lib/api/admin";
import { Ionicons } from "@expo/vector-icons";

export default function AdminBulkActionsScreen() {
  const queryClient = useQueryClient();

  // Bulk suspend users
  const [userIds, setUserIds] = useState("");
  const [suspendReason, setSuspendReason] = useState("");

  // Bulk delete products
  const [productIds, setProductIds] = useState("");

  const suspendMutation = useMutation({
    mutationFn: (payload: { userIds: string[]; suspended: boolean; reason: string }) =>
      bulkSuspendUsers(payload),
    onSuccess: (res: { message?: string; affectedCount?: number }) => {
      Alert.alert("Done", res.message || `${res.affectedCount} user(s) suspended.`);
      setUserIds("");
      setSuspendReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert("Error", msg || "Bulk suspend failed.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (payload: { productIds: string[] }) => bulkDeleteProducts(payload),
    onSuccess: (res: { message?: string; affectedCount?: number }) => {
      Alert.alert("Done", res.message || `${res.affectedCount} product(s) deleted.`);
      setProductIds("");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert("Error", msg || "Bulk delete failed.");
    },
  });

  const parseIds = (raw: string) =>
    raw.split(/[\n,\s]+/).map((s) => s.trim()).filter(Boolean);

  return (
    <Screen className="bg-slate-50 dark:bg-slate-950" safeAreaTop={false} safeAreaBottom={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView className="flex-1 px-4 pt-4 pb-10" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text className="text-[13px] font-outfit-m text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Admin Tools</Text>
        <Text className="text-[24px] font-outfit-bl text-slate-900 dark:text-white mb-6">Bulk Actions</Text>

        {/* Bulk Suspend Users */}
        <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none mb-5">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="h-10 w-10 rounded-2xl bg-red-50 dark:bg-red-950/30 items-center justify-center">
              <Ionicons name="person-remove-outline" size={20} color="#dc2626" />
            </View>
            <View>
              <Text className="text-[17px] font-outfit-sb text-slate-900 dark:text-white">Bulk Suspend Users</Text>
              <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400">Max 50 users per action</Text>
            </View>
          </View>

          <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400 mb-1.5">User IDs (comma or newline separated)</Text>
          <TextInput
            value={userIds}
            onChangeText={setUserIds}
            placeholder="userId1, userId2, ..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-[14px] font-outfit text-slate-900 dark:text-white mb-3"
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />

          <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400 mb-1.5">Reason (optional)</Text>
          <TextInput
            value={suspendReason}
            onChangeText={setSuspendReason}
            placeholder="Reason for suspension..."
            placeholderTextColor="#94a3b8"
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-[14px] font-outfit text-slate-900 dark:text-white mb-4"
          />

          <Pressable
            onPress={() => {
              const ids = parseIds(userIds);
              if (ids.length === 0) { Alert.alert("Required", "Enter at least one user ID."); return; }
              Alert.alert("Confirm", `Suspend ${ids.length} user(s)?`, [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Suspend",
                  style: "destructive",
                  onPress: () => suspendMutation.mutate({ userIds: ids, suspended: true, reason: suspendReason.trim() }),
                },
              ]);
            }}
            disabled={suspendMutation.isPending}
            className="rounded-xl bg-red-600 py-3.5 items-center"
          >
            <Text className="text-[15px] font-outfit-sb text-white">
              {suspendMutation.isPending ? "Suspending..." : "Suspend Users"}
            </Text>
          </Pressable>
        </View>

        {/* Bulk Delete Products */}
        <View className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm shadow-slate-200/50 dark:shadow-none mb-5">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="h-10 w-10 rounded-2xl bg-orange-50 dark:bg-orange-950/30 items-center justify-center">
              <Ionicons name="trash-outline" size={20} color="#ea580c" />
            </View>
            <View>
              <Text className="text-[17px] font-outfit-sb text-slate-900 dark:text-white">Bulk Delete Products</Text>
              <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400">Max 50 products per action</Text>
            </View>
          </View>

          <Text className="text-[12px] font-outfit-m text-slate-500 dark:text-slate-400 mb-1.5">Product IDs (comma or newline separated)</Text>
          <TextInput
            value={productIds}
            onChangeText={setProductIds}
            placeholder="productId1, productId2, ..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-[14px] font-outfit text-slate-900 dark:text-white mb-4"
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />

          <Pressable
            onPress={() => {
              const ids = parseIds(productIds);
              if (ids.length === 0) { Alert.alert("Required", "Enter at least one product ID."); return; }
              Alert.alert("Confirm", `Delete ${ids.length} product(s)? This cannot be undone.`, [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => deleteMutation.mutate({ productIds: ids }),
                },
              ]);
            }}
            disabled={deleteMutation.isPending}
            className="rounded-xl bg-orange-600 py-3.5 items-center"
          >
            <Text className="text-[15px] font-outfit-sb text-white">
              {deleteMutation.isPending ? "Deleting..." : "Delete Products"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
