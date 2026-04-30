import { Text, View } from "react-native";

export function PageHeader({ title }: { title: string; subtitle?: string }) {
  return (
    <View className="bg-primary-600 dark:bg-primary-900 px-5 pt-4 pb-4 shadow-sm z-10">
      <Text className="text-[22px] font-outfit-bl text-white tracking-wide">{title}</Text>
    </View>
  );
}
