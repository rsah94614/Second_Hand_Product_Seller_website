import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function SettingRow({
  href,
  title,
  subtitle,
  icon,
  iconColor = "#64748b",
  iconBg = "bg-slate-100 dark:bg-slate-800",
  destructive = false,
  onPress,
  rightContent,
}: {
  href?: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  destructive?: boolean;
  onPress?: () => void;
  rightContent?: React.ReactNode;
}) {
  const content = (
    <View className="flex-row items-center px-5 py-4">
      <View className={`h-9 w-9 rounded-2xl items-center justify-center mr-4 ${iconBg}`}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className={`text-[16px] font-outfit-m ${destructive ? "text-red-500" : "text-slate-800 dark:text-slate-200"}`}>{title}</Text>
        {subtitle ? <Text className="text-[12px] font-outfit text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</Text> : null}
      </View>
      {rightContent || <Ionicons name="chevron-forward" size={16} color="#94a3b8" />}
    </View>
  );

  if (href) {
    return (
      <Link href={href as never} asChild>
        <Pressable className="active:bg-slate-50 dark:active:bg-slate-800/50">{content}</Pressable>
      </Link>
    );
  }
  if (onPress) {
    return <Pressable onPress={onPress} className="active:bg-slate-50 dark:active:bg-slate-800/50">{content}</Pressable>;
  }
  return content;
}
