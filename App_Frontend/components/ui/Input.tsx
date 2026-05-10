import { Text, TextInput, View, TextInputProps, Pressable } from "react-native";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  errorMessage?: string;
};

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = "default",
  multiline,
  className = "",
  inputClassName = "",
  errorMessage,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const inputStyle = {
    borderColor: errorMessage
      ? isDark
        ? "rgba(239, 68, 68, 0.5)"
        : "#f87171"
      : isFocused
        ? isDark
          ? "#818cf8"
          : "#6366f1"
        : isDark
          ? "#1e293b"
          : "#e2e8f0",
    backgroundColor: errorMessage
      ? isDark
        ? "rgba(69, 10, 10, 0.2)"
        : "rgba(254, 242, 242, 0.5)"
      : isDark
        ? "#0f172a"
        : "#ffffff",
    shadowColor: isFocused && !errorMessage ? "#6366f1" : "transparent",
    shadowOpacity: isFocused && !errorMessage ? 0.1 : 0,
    shadowRadius: isFocused && !errorMessage ? 4 : 0,
    elevation: isFocused && !errorMessage ? 1 : 0,
  };

  return (
    <View className={`mb-4 w-full ${className}`}>
      {label ? (
        <Text className="mb-2 text-sm font-outfit-m text-slate-700 dark:text-slate-300">
          {label}
        </Text>
      ) : null}
      
      <View className="relative justify-center">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`rounded-2xl border px-4 py-4 ${secureTextEntry ? "pr-12" : ""} text-[16px] font-outfit text-slate-900 dark:text-white ${inputClassName}`}
          placeholderTextColor="#94a3b8"
          style={inputStyle}
        />
        {secureTextEntry ? (
          <Pressable 
            className="absolute right-4 top-0 bottom-0 justify-center h-full"
            style={{ zIndex: 10, elevation: 2 }}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#94a3b8" />
          </Pressable>
        ) : null}
      </View>
      
      {errorMessage ? (
        <Text className="mt-1.5 text-xs font-outfit text-red-500 ml-1">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
