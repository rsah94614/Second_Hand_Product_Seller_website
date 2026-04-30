import { Text, TextInput, View, TextInputProps, Pressable } from "react-native";
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
          className={`rounded-2xl border ${
            errorMessage
              ? "border-red-400 dark:border-red-500/50 bg-red-50/50 dark:bg-red-950/20"
              : isFocused
              ? "border-primary-500 dark:border-primary-400 bg-white dark:bg-slate-900 shadow-sm shadow-primary-500/10"
              : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900"
          } px-4 py-4 ${secureTextEntry ? "pr-12" : ""} text-[16px] font-outfit text-slate-900 dark:text-white transition-colors duration-200 ${inputClassName}`}
          placeholderTextColor="#94a3b8"
          style={{}}
        />
        {secureTextEntry ? (
          <Pressable 
            className="absolute right-4 top-0 bottom-0 justify-center h-full"
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
