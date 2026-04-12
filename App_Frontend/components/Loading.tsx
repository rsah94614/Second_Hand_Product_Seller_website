import { ActivityIndicator, Text, View } from "react-native";

export function Loading({ message = "Loading…" }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center p-8 bg-transparent">
      <ActivityIndicator size="large" color="#6366f1" />
      <Text className="mt-4 text-[15px] font-outfit-m text-slate-500 dark:text-slate-400">{message}</Text>
    </View>
  );
}
