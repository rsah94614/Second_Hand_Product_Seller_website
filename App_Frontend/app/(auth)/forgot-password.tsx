import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    const res = await forgotPassword(email.trim());
    setLoading(false);
    if (res.success) {
      Alert.alert("Check your email", res.message || "Reset link sent.");
      router.push("/login");
    } else {
      Alert.alert("Error", res.message || "Could not send email.");
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
          <Input 
            label="Email Address" 
            value={email} 
            onChangeText={setEmail} 
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
