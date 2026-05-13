import { Text, View } from "react-native";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="bg-white dark:bg-slate-900 px-5 pt-4 pb-5 border-b border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/20 dark:shadow-none z-10">
      <Text className="text-[24px] font-outfit-bl text-slate-900 dark:text-white tracking-tight">{title}</Text>
      {subtitle ? (
        <Text className="text-[13px] font-outfit text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</Text>
      ) : null}
    </View>
  );
}
