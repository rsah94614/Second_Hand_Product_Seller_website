import { Pressable, Text, ActivityIndicator } from "react-native";
import * as Haptics from 'expo-haptics';

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "danger" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  className = "",
  textClassName = "",
}: Props) {
  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const getBaseStyle = () => {
    let style = "rounded-2xl px-5 py-4 items-center justify-center flex-row min-h-[56px] ";
    
    switch (variant) {
      case "outline":
        style += "border-2 border-slate-200 dark:border-slate-700 bg-transparent active:bg-slate-50 dark:active:bg-slate-800/50";
        break;
      case "danger":
        style += "bg-red-500 dark:bg-red-600 active:bg-red-600 dark:active:bg-red-700 shadow-lg shadow-red-500/20";
        break;
      case "ghost":
        style += "bg-transparent active:bg-slate-100 dark:active:bg-slate-800";
        break;
      case "primary":
      default:
        style += "bg-primary-600 dark:bg-primary-500 active:bg-primary-700 dark:active:bg-primary-600 shadow-lg shadow-primary-600/20";
        break;
    }
    return style;
  };

  const getTextStyle = () => {
    let style = "text-[16px] font-outfit-sb ";
    switch (variant) {
      case "outline":
        style += "text-slate-800 dark:text-slate-200";
        break;
      case "danger":
        style += "text-white";
        break;
      case "ghost":
        style += "text-primary-600 dark:text-primary-400";
        break;
      case "primary":
      default:
        style += "text-white";
        break;
    }
    return style;
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      className={`${getBaseStyle()} ${disabled || loading ? "opacity-60 " : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === "outline" ? "gray" : variant === "ghost" ? "#6366f1" : "#ffffff"} 
        />
      ) : (
        <Text className={`${getTextStyle()} ${textClassName}`}>{title}</Text>
      )}
    </Pressable>
  );
}
