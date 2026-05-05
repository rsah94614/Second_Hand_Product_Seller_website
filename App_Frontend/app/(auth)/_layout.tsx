import { Stack, router } from "expo-router";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

export default function AuthLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const BackButton = () => (
    <Pressable 
      onPress={() => { 
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(tabs)");
        }
      }}
      className="pr-4"
    >
      <Ionicons name="arrow-back" size={24} color={isDark ? "#ffffff" : "#1e293b"} />
    </Pressable>
  );

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: "",
        headerShadowVisible: false,
        headerBackTitle: "Back",
        headerTintColor: isDark ? "#ffffff" : "#1e293b",
        headerStyle: {
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
        },
        headerLeft: () => <BackButton />,
        contentStyle: {
          backgroundColor: isDark ? "#020617" : "#f8fafc",
        },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="login" options={{ title: "Sign in" }} />
      <Stack.Screen name="register" options={{ title: "Create account" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Forgot password" }} />
      <Stack.Screen name="reset-password" options={{ title: "Reset password" }} />
      <Stack.Screen name="verify-email" options={{ title: "Verify email" }} />
    </Stack>
  );
}
