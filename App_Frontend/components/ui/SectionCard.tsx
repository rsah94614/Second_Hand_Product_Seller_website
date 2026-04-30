import { View } from "react-native";

export function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/50 dark:shadow-none divide-y divide-slate-100 dark:divide-slate-800">
      {children}
    </View>
  );
}
