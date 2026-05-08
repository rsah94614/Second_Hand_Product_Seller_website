import "../global.css";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { useMemo, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_900Black,
} from "@expo-google-fonts/outfit";

import { AuthProvider } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";

import { useColorScheme } from "nativewind";
import { ThemeProvider, DefaultTheme, DarkTheme } from "@react-navigation/native";

SplashScreen.preventAutoHideAsync();
configureReanimatedLogger({
  level: ReanimatedLogLevel.error,
  strict: false,
});

export default function RootLayout() {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
            staleTime: 60 * 1000,
          },
        },
      }),
    []
  );

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [fontsLoaded, fontError] = useFonts({
    "Outfit-Regular": Outfit_400Regular,
    "Outfit-Medium": Outfit_500Medium,
    "Outfit-SemiBold": Outfit_600SemiBold,
    "Outfit-Bold": Outfit_700Bold,
    "Outfit-Black": Outfit_900Black,
  });

  // Fix D1: Sync the OS-level root background to prevent white flash on
  // dark mode launch and during screen transitions.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(isDark ? "#020617" : "#f8fafc");
  }, [isDark]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const stackAnimation = Platform.OS === "ios" ? "default" : "slide_from_right";

  const sharedHeaderStyle = {
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
  };
  const sharedTintColor = isDark ? "#ffffff" : "#1e293b";

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <Stack
              screenOptions={{
                headerTitleStyle: { fontFamily: "Outfit-SemiBold", fontSize: 17 },
                headerTintColor: sharedTintColor,
                headerStyle: sharedHeaderStyle,
                headerShadowVisible: false,
                contentStyle: {
                  backgroundColor: isDark ? "#020617" : "#f8fafc",
                },
                animation: stackAnimation,
                gestureEnabled: true,
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: "none" }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false, animation: stackAnimation }} />
              <Stack.Screen name="admin" options={{ headerShown: false, animation: stackAnimation }} />
              <Stack.Screen
                name="notification-preferences"
                options={{ title: "Notification Preferences" }}
              />
              <Stack.Screen name="devices" options={{ title: "Active Devices" }} />
              <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
              <Stack.Screen name="my-products" options={{ title: "My Listings" }} />
              <Stack.Screen name="create-product" options={{ title: "Create Listing" }} />
              <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
              <Stack.Screen name="wishlist" options={{ title: "Wishlist" }} />
              <Stack.Screen name="edit-product/[id]" options={{ title: "Edit Listing", animation: "none" }} />
              <Stack.Screen name="product/[id]" options={{ title: "Product Details" }} />
              <Stack.Screen name="order/[id]" options={{ title: "Place Order" }} />
              <Stack.Screen name="orders" options={{ title: "My Orders" }} />
              <Stack.Screen name="chat/[userId]" options={{ title: "Chat" }} />
              <Stack.Screen name="review/[sellerId]" options={{ title: "Review" }} />
            </Stack>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
