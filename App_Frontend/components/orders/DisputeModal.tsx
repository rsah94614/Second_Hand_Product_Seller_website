import React, { useState } from "react";
import { View, Text, Pressable, TextInput, Modal, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardShiftView } from "../ui/KeyboardShiftView";

export type DisputeReason = "damaged" | "not_received" | "not_as_described" | "other";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { reason: DisputeReason; description: string }) => void;
  loading: boolean;
};

export function DisputeModal({ visible, onClose, onSubmit, loading }: Props) {
  const [reason, setReason] = useState<DisputeReason>("not_as_described");
  const [description, setDescription] = useState("");

  const reasonOptions: { value: DisputeReason; label: string; hint: string }[] = [
    { value: "damaged", label: "Item damaged", hint: "The item was broken or unusable." },
    { value: "not_received", label: "Item not received", hint: "You did not receive the item." },
    { value: "not_as_described", label: "Not as described", hint: "The item did not match the listing." },
    { value: "other", label: "Other issue", hint: "Anything else that went wrong." },
  ];

  const handleOpen = () => {
    setReason("not_as_described");
    setDescription("");
  };

  if (!visible) return null;

  return (
    <Modal visible={true} transparent animationType="slide" onShow={handleOpen} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <KeyboardShiftView>
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

                <View className="mb-5 gap-2">
                  {reasonOptions.map((option) => {
                    const selected = reason === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setReason(option.value)}
                        className={`rounded-2xl border p-4 ${selected
                          ? "border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-950/30"
                          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/40"
                        }`}
                      >
                        <Text className={`text-[14px] font-outfit-sb ${selected ? "text-red-700 dark:text-red-300" : "text-slate-900 dark:text-white"}`}>
                          {option.label}
                        </Text>
                        <Text className={`mt-1 text-[12px] font-outfit ${selected ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
                          {option.hint}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <TextInput
                  multiline
                  numberOfLines={4}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Explain what happened and add any details that would help review the issue."
                  placeholderTextColor="#94a3b8"
                  className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-[15px] font-outfit text-slate-900 dark:text-white mb-8 min-h-[120px] border border-slate-100 dark:border-slate-800"
                />

                <View className="flex-row gap-3">
                  <Pressable onPress={onClose} className="flex-1 h-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <Text className="text-[15px] font-outfit-sb text-slate-700 dark:text-slate-200">Cancel</Text>
                  </Pressable>
                  <Pressable
                    disabled={loading || !description.trim()}
                    onPress={() => onSubmit({ reason, description: description.trim() })}
                    className={`flex-1 h-12 items-center justify-center rounded-2xl bg-red-600 ${loading || !description.trim() ? "opacity-60" : ""}`}
                  >
                    {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-[15px] font-outfit-sb text-white">Submit</Text>}
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardShiftView>
      </View>
    </Modal>
  );
}
