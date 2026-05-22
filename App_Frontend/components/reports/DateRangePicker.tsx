import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { formatDate, getPresetDateRange, validateDateRange } from "../../lib/utils/formatting";
import { Input } from "../ui/Input";

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  maxDays?: number;
  showPresets?: boolean;
}

const PRESETS = [
  { label: "Last 7 days", value: "7d" as const },
  { label: "Last 30 days", value: "30d" as const },
  { label: "Last 90 days", value: "90d" as const },
  { label: "Last 365 days", value: "365d" as const },
];

export function DateRangePicker({
  startDate,
  endDate,
  onDateRangeChange,
  maxDays = 365,
  showPresets = true,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(formatDate(startDate));
  const [tempEndDate, setTempEndDate] = useState(formatDate(endDate));
  const [error, setError] = useState<string | null>(null);

  const handleApply = () => {
    // Parse dates in DD/MM/YYYY format
    const parseLocalDate = (dateStr: string): Date | null => {
      const parts = dateStr.split("/");
      if (parts.length !== 3) return null;
      const [day, month, year] = parts.map(Number);
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date;
    };

    const newStart = parseLocalDate(tempStartDate);
    const newEnd = parseLocalDate(tempEndDate);

    if (!newStart || !newEnd) {
      setError("Invalid date format. Use DD/MM/YYYY");
      return;
    }

    const validation = validateDateRange(newStart, newEnd, maxDays);
    if (!validation.isValid) {
      setError(validation.error || "Invalid date range");
      return;
    }

    onDateRangeChange(newStart, newEnd);
    setError(null);
    setIsOpen(false);
  };

  const handlePreset = (preset: "7d" | "30d" | "90d" | "365d") => {
    const { startDate: newStart, endDate: newEnd } = getPresetDateRange(preset);
    onDateRangeChange(newStart, newEnd);
    setTempStartDate(formatDate(newStart));
    setTempEndDate(formatDate(newEnd));
    setError(null);
    setIsOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        className="flex-row items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
      >
        <Ionicons name="calendar" size={16} color="#64748b" />
        <Text className="text-[14px] font-outfit text-slate-700 dark:text-slate-300">
          {formatDate(startDate)} - {formatDate(endDate)}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#64748b" />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade">
        <Pressable
          onPress={() => setIsOpen(false)}
          className="flex-1 bg-black/50 justify-end"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 max-h-[80%]"
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-[18px] font-outfit-sb text-slate-900 dark:text-white">
                Select Date Range
              </Text>
              <Pressable onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {showPresets && (
                <>
                  <Text className="text-[12px] font-outfit-sb text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                    Quick Select
                  </Text>
                  <View className="flex-row flex-wrap gap-2 mb-6">
                    {PRESETS.map((preset) => (
                      <Pressable
                        key={preset.value}
                        onPress={() => handlePreset(preset.value)}
                        className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      >
                        <Text className="text-[13px] font-outfit-m text-slate-700 dark:text-slate-300">
                          {preset.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View className="h-px bg-slate-200 dark:bg-slate-700 mb-6" />
                </>
              )}

              <Text className="text-[12px] font-outfit-sb text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                Custom Range
              </Text>

              <View className="mb-4">
                <Text className="text-[13px] font-outfit-m text-slate-700 dark:text-slate-300 mb-2">
                  Start Date (DD/MM/YYYY)
                </Text>
                <Input
                  value={tempStartDate}
                  onChangeText={setTempStartDate}
                  placeholder="DD/MM/YYYY"
                  keyboardType="decimal-pad"
                />
              </View>

              <View className="mb-4">
                <Text className="text-[13px] font-outfit-m text-slate-700 dark:text-slate-300 mb-2">
                  End Date (DD/MM/YYYY)
                </Text>
                <Input
                  value={tempEndDate}
                  onChangeText={setTempEndDate}
                  placeholder="DD/MM/YYYY"
                  keyboardType="decimal-pad"
                />
              </View>

              {error && (
                <View className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <Text className="text-[13px] font-outfit text-red-700 dark:text-red-400">
                    {error}
                  </Text>
                </View>
              )}

              <View className="flex-row gap-3 mt-6">
                <Pressable
                  onPress={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <Text className="text-[14px] font-outfit-sb text-slate-700 dark:text-slate-300 text-center">
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleApply}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary-600"
                >
                  <Text className="text-[14px] font-outfit-sb text-white text-center">
                    Apply
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
