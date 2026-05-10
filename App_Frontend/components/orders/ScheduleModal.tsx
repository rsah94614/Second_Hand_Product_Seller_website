import React, { useState } from "react";
import { View, Text, Pressable, TextInput, Modal, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareWrapper } from "../ui/KeyboardAwareWrapper";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { location: string; scheduledAt: string; notes: string }) => void;
  loading: boolean;
};

export function ScheduleModal({ visible, onClose, onSubmit, loading }: Props) {
  const [location, setLocation] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");

  const handleOpen = () => {
    setLocation("");
    setScheduledAt("");
    setNotes("");
  };

  if (!visible) return null;

  return (
    <Modal visible={true} transparent animationType="slide" onShow={handleOpen} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <KeyboardAwareWrapper useSafeArea={false}>
          <View className="bg-white dark:bg-slate-900 rounded-t-[32px] overflow-hidden">
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View className="p-6 pb-10">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-[20px] font-outfit-b text-slate-900 dark:text-white">Schedule Meetup</Text>
                  <Pressable onPress={onClose} className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <Ionicons name="close" size={20} color="#64748b" />
                  </Pressable>
                </View>

                <View className="mb-4">
                  <Text className="text-[14px] font-outfit-sb text-slate-700 dark:text-slate-300 mb-2">Location</Text>
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="e.g., Near Library, Canteen, Gate No. 1"
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800"
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-[14px] font-outfit-sb text-slate-700 dark:text-slate-300 mb-2">Time (Optional)</Text>
                  <TextInput
                    value={scheduledAt}
                    onChangeText={setScheduledAt}
                    placeholder="e.g., Today at 5 PM, Tomorrow Morning"
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800"
                  />
                </View>

                <View className="mb-8">
                  <Text className="text-[14px] font-outfit-sb text-slate-700 dark:text-slate-300 mb-2">Notes (Optional)</Text>
                  <TextInput
                    multiline
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="e.g., I'll be wearing a blue t-shirt"
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3 text-[15px] font-outfit text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 min-h-[80px]"
                  />
                </View>

                <View className="flex-row gap-3">
                  <Pressable onPress={onClose} className="flex-1 h-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <Text className="text-[15px] font-outfit-sb text-slate-700 dark:text-slate-200">Cancel</Text>
                  </Pressable>
                  <Pressable
                    disabled={loading || !location.trim()}
                    onPress={() => onSubmit({ location, scheduledAt, notes })}
                    className={`flex-1 h-12 items-center justify-center rounded-2xl bg-primary-600 ${loading || !location.trim() ? "opacity-60" : ""}`}
                  >
                    {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-[15px] font-outfit-sb text-white">Save</Text>}
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAwareWrapper>
      </View>
    </Modal>
  );
}
