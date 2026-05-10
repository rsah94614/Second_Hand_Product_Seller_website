import React, { useState } from "react";
import { View, Text, Pressable, TextInput, Modal, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { KeyboardAwareWrapper } from "../ui/KeyboardAwareWrapper";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { targetType: string; reason: string; details: string }) => void;
  loading: boolean;
  hasSeller: boolean;
};

export function ReportModal({ visible, onClose, onSubmit, loading, hasSeller }: Props) {
  const [form, setForm] = useState({ targetType: 'product', reason: '', details: '' });

  const handleOpen = () => {
    setForm({ targetType: 'product', reason: '', details: '' });
  };

  if (!visible) return null;

  return (
    <Modal visible={true} animationType="slide" transparent onShow={handleOpen} onRequestClose={onClose}>
      <KeyboardAwareWrapper useSafeArea={false} style={{ flex: 1 }}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl bg-slate-50 dark:bg-slate-950 p-6 pt-4 pb-12">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-outfit-bl text-slate-900 dark:text-white">Report Issue</Text>
              <Pressable onPress={onClose} className="p-1">
                <Ionicons name="close" size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <View className="flex-row gap-3 mb-6">
              <Pressable
                onPress={() => setForm(prev => ({ ...prev, targetType: "product" }))}
                className={`flex-1 py-3 rounded-xl border ${form.targetType === "product" ? "bg-primary-50 border-primary-200 dark:bg-primary-900/30 dark:border-primary-800" : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"}`}
              >
                <Text className={`text-center font-outfit-sb ${form.targetType === "product" ? "text-primary-700 dark:text-primary-400" : "text-slate-600 dark:text-slate-400"}`}>Report Listing</Text>
              </Pressable>
              {hasSeller && (
                <Pressable
                  onPress={() => setForm(prev => ({ ...prev, targetType: "user" }))}
                  className={`flex-1 py-3 rounded-xl border ${form.targetType === "user" ? "bg-primary-50 border-primary-200 dark:bg-primary-900/30 dark:border-primary-800" : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"}`}
                >
                  <Text className={`text-center font-outfit-sb ${form.targetType === "user" ? "text-primary-700 dark:text-primary-400" : "text-slate-600 dark:text-slate-400"}`}>Report Owner</Text>
                </Pressable>
              )}
            </View>

            <Input
              label="Reason"
              value={form.reason}
              onChangeText={(t) => setForm(prev => ({ ...prev, reason: t }))}
              placeholder="E.g. spam, fake photos, abusive"
            />

            <TextInput
              value={form.details}
              onChangeText={(t) => setForm(prev => ({ ...prev, details: t }))}
              placeholder="Additional details (optional)"
              placeholderTextColor="#94a3b8"
              multiline
              className="min-h-[100px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-[16px] font-outfit text-slate-900 dark:text-white mb-6"
              textAlignVertical="top"
            />

            <Button
              title="Submit Report"
              variant="danger"
              loading={loading}
              onPress={() => {
                if (!form.reason.trim()) {
                  Alert.alert("Required", "Please provide a reason.");
                  return;
                }
                onSubmit(form);
              }}
            />
          </View>
        </View>
      </KeyboardAwareWrapper>
    </Modal>
  );
}
