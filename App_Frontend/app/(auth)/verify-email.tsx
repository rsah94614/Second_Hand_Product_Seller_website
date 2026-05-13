import { useEffect, useState } from "react";
import { Link, router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/AppToast";

export default function VerifyEmailScreen() {
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const { verifyEmail, resendVerificationEmail } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const token = typeof tokenParam === "string" ? tokenParam.trim() : "";

    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing. Open this screen from your email link.");
      return;
    }

    let active = true;
    (async () => {
      const result = await verifyEmail(token);
      if (!active) return;

      if (result.success) {
        setStatus("success");
        setMessage(result.message || "Email verified successfully.");
        showToast(result.message || "Email verified successfully.");
        setTimeout(() => {
          router.replace("/" as never);
        }, 2000);
      } else {
        setStatus("error");
        setMessage(result.message || "Failed to verify email.");
      }
    })();

    return () => {
      active = false;
    };
  }, [tokenParam, verifyEmail, showToast]);

  const handleResend = async () => {
    setResending(true);
    const result = await resendVerificationEmail();
    setResending(false);

    if (result.success) {
      setMessage(result.message || "Verification email sent.");
      showToast(result.message || "Verification email sent.");
    } else {
      setMessage(result.message || "Failed to resend verification email.");
    }
  };

  return (
    <Screen>
      <ScrollView className="flex-1 px-6 pt-12" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center">
          <View className="mb-8">
            <View className="mb-6 h-16 w-16 items-center justify-center rounded-3xl bg-primary-100 dark:bg-primary-900/40">
              <Text className="text-3xl">
                {status === "verifying" ? "..." : status === "success" ? "OK" : "!"}
              </Text>
            </View>
            <Text className="text-3xl font-outfit-bl leading-tight text-slate-900 dark:text-white">
              {status === "verifying" ? "Verifying Email" : status === "success" ? "Email Verified" : "Verification Failed"}
            </Text>
            <Text className="mt-3 text-[15px] font-outfit text-slate-500 dark:text-slate-400">
              {status === "verifying"
                ? "Please wait while we confirm your email address."
                : message}
            </Text>
          </View>

          {status === "error" ? (
            <View className="gap-3">
              <Button title={resending ? "Sending..." : "Resend Verification Email"} onPress={handleResend} loading={resending} />
              <Link href="/login" asChild>
                <Pressable className="items-center rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                  <Text className="text-[15px] font-outfit-sb text-slate-700 dark:text-slate-200">Back to Sign In</Text>
                </Pressable>
              </Link>
            </View>
          ) : null}

          {status === "success" ? (
            <Text className="mt-2 text-[13px] font-outfit text-slate-400 dark:text-slate-500">
              Redirecting you back to the app...
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
