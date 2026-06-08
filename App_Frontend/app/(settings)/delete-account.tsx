import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, Alert } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { deleteAccount } from "../../lib/api/users";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/AppToast";
import { KeyboardShiftView } from "../../components/ui/KeyboardShiftView";

export default function DeleteAccountScreen() {
  const [confirmation, setConfirmation] = useState("");
  const { logout } = useAuth();
  const { showToast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      logout();
      showToast("Your account has been deleted", { type: "success" });
      // App state clears via AuthContext and pushes to login automatically
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Failed to delete account";
      Alert.alert("Error", msg);
    },
  });

  const handleDelete = () => {
    if (confirmation !== "DELETE") return;

    Alert.alert(
      "Final Confirmation",
      "Are you absolutely sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: () => deleteMutation.mutate()
        }
      ]
    );
  };

  return (
    <Screen className="bg-white dark:bg-slate-950">
      <KeyboardShiftView>
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, flexGrow: 1, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-full items-center justify-center mb-6">
            <Ionicons name="warning" size={32} color="#ef4444" />
          </View>

          <Text className="text-2xl font-outfit-b text-slate-900 dark:text-white mb-4">
            Delete Account
          </Text>

          <Text className="text-[16px] font-outfit text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            We&apos;re sorry to see you go. Deleting your account will immediately remove your access to Campus Mitra.
          </Text>

          <View className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 mb-8">
            <Text className="font-outfit-sb text-red-800 dark:text-red-400 mb-2">What happens next?</Text>
            <View className="flex-row items-start mb-2">
              <Text className="text-red-500 mr-2">•</Text>
              <Text className="text-red-700 dark:text-red-300 font-outfit text-[14px] flex-1">Your profile, listings, and personal data will be removed or anonymized.</Text>
            </View>
            <View className="flex-row items-start mb-2">
              <Text className="text-red-500 mr-2">•</Text>
              <Text className="text-red-700 dark:text-red-300 font-outfit text-[14px] flex-1">Your past completed orders will remain for the other party, but your identity will be hidden.</Text>
            </View>
            <View className="flex-row items-start">
              <Text className="text-red-500 mr-2">•</Text>
              <Text className="text-red-700 dark:text-red-300 font-outfit text-[14px] flex-1">You will be logged out immediately.</Text>
            </View>
          </View>

          <Text className="text-[15px] font-outfit-m text-slate-900 dark:text-white mb-2">
            To verify, type <Text className="font-outfit-b text-red-500">DELETE</Text> below:
          </Text>

          <TextInput
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder="Type DELETE"
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
            className="h-14 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 font-outfit text-[16px] text-slate-900 dark:text-white mb-8 focus:border-red-500"
          />

          <View style={{ marginTop: "auto", paddingTop: 24 }}>
            <Button
              title="I understand, delete my account"
              variant="danger"
              onPress={handleDelete}
              disabled={confirmation !== "DELETE" || deleteMutation.isPending}
              loading={deleteMutation.isPending}
              className="mb-3"
            />
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => router.back()}
              disabled={deleteMutation.isPending}
            />
          </View>
        </ScrollView>
      </KeyboardShiftView>
    </Screen>
  );
}
