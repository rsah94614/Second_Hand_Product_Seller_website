import { View, Text } from "react-native";
import { Button } from "./ui/Button";

type Props = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, actionLabel, onAction }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <View className="w-full max-w-[320px] items-center px-6 py-10">
        <View className="mb-6 h-20 w-20 rounded-full bg-primary-50 dark:bg-primary-950/30 items-center justify-center">
          <Text className="text-3xl">🏜️</Text>
        </View>
        <Text className="text-center text-[22px] font-outfit-sb text-slate-900 dark:text-white leading-tight">{title}</Text>
        {message ? (
          <Text className="mt-3 text-center text-[15px] font-outfit text-slate-500 dark:text-slate-400">{message}</Text>
        ) : null}
        {actionLabel && onAction ? (
          <Button title={actionLabel} onPress={onAction} className="mt-8 w-full" variant="outline" />
        ) : null}
      </View>
    </View>
  );
}
