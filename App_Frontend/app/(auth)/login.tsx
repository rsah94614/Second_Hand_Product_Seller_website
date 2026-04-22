import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const { login, user } = useAuth();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(typeof emailParam === "string" ? emailParam : "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user) {
      router.replace("/" as never);
    }
  }, [user]);

  const onSubmit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      router.replace("/" as never);
    } else {
      setErrorMessage(res.message || "Sign in failed. Please try again.");
    }
  };

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-12" keyboardShouldPersistTaps="handled">
        <View className="mb-10">

           <Text className="text-4xl font-outfit-bl text-slate-900 dark:text-white leading-tight">
              Welcome Back
           </Text>
           <Text className="mt-3 text-[16px] font-outfit text-slate-500 dark:text-slate-400">
             Sign in to continue exploring Campus Mitra.
           </Text>
        </View>

        <View className="mb-8">
          {errorMessage ? (
            <View className="mb-6 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/20 px-4 py-4 backdrop-blur-md">
              <Text className="text-[14px] font-outfit-m text-red-600 dark:text-red-400">{errorMessage}</Text>
            </View>
          ) : null}
          <Input 
            label="Email Address" 
            value={email} 
            onChangeText={setEmail} 
            keyboardType="email-address" 
            placeholder="Enter your email address"
          />
          <Input 
            label="Password" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            placeholder="Enter your password"
          />
          <View className="flex-row justify-end mt-1">
            <Link href="/forgot-password" asChild>
              <Pressable className="py-2">
                <Text className="text-[14px] font-outfit-sb text-primary-600 dark:text-primary-400">
                  Forgot Password?
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <Button title="Sign In" onPress={onSubmit} loading={loading} />
        
        <View className="mt-8 flex-row justify-center items-center">
           <Text className="text-[15px] font-outfit text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{" "}
           </Text>
           <Link href="/register" asChild>
             <Pressable className="py-2">
               <Text className="text-[15px] font-outfit-sb text-primary-600 dark:text-primary-400">
                 Create one
               </Text>
             </Pressable>
           </Link>
        </View>
        <View className="h-20" />
      </ScrollView>
    </Screen>
  );
}
