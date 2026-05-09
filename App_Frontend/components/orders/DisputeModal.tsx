import React, { useState } from "react";
import { View, Text, Pressable, TextInput, Modal, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DynamicKeyboardView } from "../ui/DynamicKeyboardView";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  loading: boolean;
};

export function DisputeModal({ visible, onClose, onSubmit, loading }: Props) {
  const [reason, setReason] = useState("");

  const handleOpen = () => {
    setReason("");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onShow={handleOpen} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <DynamicKeyboardView>
          <View className="bg-white dark:bg-slate-900 rounded-t-[32px] overflow-hidden">
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View className="p-6 pb-10">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-[20px] font-outfit-b text-slate-900 dark:text-white">Report Problem</Text>
                  <Pressable onPress={onClose} className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <Ionicons name="close" size={20} color="#64748b" />
                  </Pressable>
                </View>

                <Text className="text-[14px] font-outfit text-slate-500 dark:text-slate-400 mb-4">
                  Describe the issue you&apos;re facing with this order. Our team will review it.
                </Text>

                <TextInput
                  multiline
                  numberOfLines={4}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="e.g., Item was not as described, seller was rude, etc."
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-[15px] font-outfit text-slate-900 dark:text-white mb-8 min-h-[120px] border border-slate-100 dark:border-slate-800"
                />

                <View className="flex-row gap-3">
                  <Pressable onPress={onClose} className="flex-1 h-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <Text className="text-[15px] font-outfit-sb text-slate-700 dark:text-slate-200">Cancel</Text>
                  </Pressable>
                  <Pressable
                    disabled={loading || !reason.trim()}
                    onPress={() => onSubmit(reason)}
                    className={`flex-1 h-12 items-center justify-center rounded-2xl bg-red-600 ${loading || !reason.trim() ? "opacity-60" : ""}`}
                  >
                    {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-[15px] font-outfit-sb text-white">Submit</Text>}
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </DynamicKeyboardView>
      </View>
    </Modal>
  );
}
