import { Link, useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View, Pressable } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";

export default function ResetPasswordScreen() {
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const { resetPassword } = useAuth();
  const [token, setToken] = useState(typeof tokenParam === "string" ? tokenParam : "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!token.trim()) {
      Alert.alert("Token required", "Open this screen from your reset email or paste the token.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Password", "Use at least 8 characters.");
      return;
    }
    setLoading(true);
    const res = await resetPassword(token.trim(), password);
    setLoading(false);
    if (res.success) {
      Alert.alert("Success", res.message || "Password updated.", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } else {
      Alert.alert("Error", res.message || "Reset failed.");
    }
  };

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-12" keyboardShouldPersistTaps="handled">
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
          <Input 
            label="Reset Token" 
            value={token} 
            onChangeText={setToken} 
            placeholder="Enter reset token"
          />
          <Input 
            label="New Password" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            placeholder="Enter new password"
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
    </Screen>
  );
}
