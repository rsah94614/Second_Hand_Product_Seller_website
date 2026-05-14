import { Text, View } from "react-native";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="bg-indigo-600 dark:bg-indigo-900 px-5 pt-4 pb-5 z-10">
      <Text className="text-[24px] font-outfit-bl text-white tracking-tight">{title}</Text>
      {subtitle ? (
        <Text className="text-[13px] font-outfit text-indigo-100 dark:text-indigo-200/80 mt-0.5">{subtitle}</Text>
      ) : null}
    </View>
  );
}
