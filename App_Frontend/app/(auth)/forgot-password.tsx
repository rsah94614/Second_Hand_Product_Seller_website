import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const onSubmit = async () => {
    if (!email.trim()) { setIsError(true); setMessage("Email address is required."); return; }
    setLoading(true);
    setMessage("");
    const res = await forgotPassword(email.trim());
    setLoading(false);
    if (res.success) {
      setIsError(false);
      setMessage(res.message || "Reset link sent. Check your email.");
    } else {
      setIsError(true);
      setMessage(res.message || "Could not send reset email.");
    }
  };

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-12" keyboardShouldPersistTaps="handled">
        <View className="mb-10">
          <View className="h-16 w-16 bg-primary-100 dark:bg-primary-900/40 rounded-3xl items-center justify-center mb-6">
            <Text className="text-3xl">🔑</Text>
          </View>
          <Text className="text-3xl font-outfit-bl text-slate-900 dark:text-white leading-tight">
            Reset Password
          </Text>
          <Text className="mt-3 text-[15px] font-outfit text-slate-500 dark:text-slate-400">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </Text>
        </View>

        <View className="mb-8">
          {message ? (
            <View className={`mb-4 rounded-2xl border px-4 py-3 ${isError ? "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/20" : "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20"}`}>
              <Text className={`text-[14px] font-outfit-m ${isError ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>{message}</Text>
            </View>
          ) : null}
          <Input
            label="Email Address"
            value={email}
            onChangeText={(t) => { setEmail(t); setMessage(""); }}
            keyboardType="email-address"
            placeholder="Enter your email address"
          />
        </View>

        <Button title="Send Reset Link" onPress={onSubmit} loading={loading} />

        <View className="mt-8 flex-row justify-center items-center">
          <Link href="/login" asChild>
            <Pressable className="py-2">
              <Text className="text-[15px] font-outfit-sb text-primary-600 dark:text-primary-400">
                Back to Sign In
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </Screen>
  );
}
