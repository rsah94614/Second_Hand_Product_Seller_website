import { Link, useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { KeyboardShiftView } from "../../components/ui/KeyboardShiftView";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/AppToast";

export default function ResetPasswordScreen() {
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const [token, setToken] = useState(typeof tokenParam === "string" ? tokenParam : "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const onSubmit = async () => {
    if (!token.trim()) { setIsError(true); setMessage("Open this screen from your reset email or paste the token."); return; }
    if (password.length < 8) { setIsError(true); setMessage("Password must be at least 8 characters."); return; }
    setLoading(true);
    setMessage("");
    const res = await resetPassword(token.trim(), password);
    setLoading(false);
    if (res.success) {
      setIsError(false);
      setMessage(res.message || "Password updated successfully.");
      showToast(res.message || "Password updated successfully.");
      setTimeout(() => router.replace("/login"), 1500);
    } else {
      setIsError(true);
      setMessage(res.message || "Reset failed. The link may have expired.");
    }
  };

  return (
    <Screen>
      <KeyboardShiftView>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 160 }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View className="mb-10">
           <View className="h-16 w-16 bg-primary-100 dark:bg-primary-900/40 rounded-3xl items-center justify-center mb-6">
              <Text className="text-3xl">🔒</Text>
           </View>
           <Text className="text-3xl font-outfit-bl text-slate-900 dark:text-white leading-tight">
              Create New Password
           </Text>
           <Text className="mt-3 text-[15px] font-outfit text-slate-500 dark:text-slate-400">
             Your new password must be unique and at least 8 characters long.
           </Text>
        </View>

        <View className="mb-8">
          {message ? (
            <View className={`mb-4 rounded-2xl border px-4 py-3 ${isError ? "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/20" : "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20"}`}>
              <Text className={`text-[14px] font-outfit-m ${isError ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>{message}</Text>
            </View>
          ) : null}
          <Input 
            label="Reset Token" 
            value={token} 
            onChangeText={(t) => { setToken(t); setMessage(""); }} 
            placeholder="Enter reset token"
          />
          <Input 
            label="New Password" 
            value={password} 
            onChangeText={(t) => { setPassword(t); setMessage(""); }} 
            secureTextEntry 
            placeholder="Enter new password (min 8 chars)"
          />
        </View>

        <Button title="Update Password" onPress={onSubmit} loading={loading} />
        
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
      </KeyboardShiftView>
    </Screen>
  );
}
