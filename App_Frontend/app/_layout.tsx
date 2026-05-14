import "../global.css";
import { Appearance, Platform } from "react-native";
import { Stack } from "expo-router";
import { useMemo, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
import { ToastProvider } from "../components/ui/AppToast";
import { AppThemeProvider, useAppTheme } from "../context/ThemeContext";

import { ThemeProvider, DefaultTheme, DarkTheme } from "@react-navigation/native";

SplashScreen.preventAutoHideAsync();
configureReanimatedLogger({
  level: ReanimatedLogLevel.error,
  strict: false,
});

function InnerLayout() {
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

  const { activeScheme } = useAppTheme();
  const isDark = activeScheme === "dark";

  const [fontsLoaded, fontError] = useFonts({
    "Outfit-Regular": Outfit_400Regular,
    "Outfit-Medium": Outfit_500Medium,
    "Outfit-SemiBold": Outfit_600SemiBold,
    "Outfit-Bold": Outfit_700Bold,
    "Outfit-Black": Outfit_900Black,
  });

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
    <SafeAreaProvider>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SocketProvider>
              <ToastProvider>
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
                  <Stack.Screen name="notification-preferences" options={{ title: "Notification Preferences" }} />
                  <Stack.Screen name="devices" options={{ title: "Active Devices" }} />
                  <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
                  <Stack.Screen name="my-products" options={{ title: "My Listings" }} />
                  <Stack.Screen name="create-product" options={{ headerShown: false }} />
                  <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
                  <Stack.Screen name="wishlist" options={{ title: "Wishlist" }} />
                  <Stack.Screen name="settings" options={{ title: "Settings" }} />
                  <Stack.Screen name="blocked-users" options={{ title: "Blocked Users" }} />
                  <Stack.Screen name="delete-account" options={{ title: "Delete Account" }} />
                  <Stack.Screen name="help-center" options={{ title: "Help Center" }} />
                  <Stack.Screen name="terms-of-service" options={{ title: "Terms of Service" }} />
                  <Stack.Screen name="privacy-policy" options={{ title: "Privacy Policy" }} />
                  <Stack.Screen name="edit-product/[id]" options={{ headerShown: false, animation: "none" }} />
                  <Stack.Screen name="product/[id]" options={{ title: "Product Details" }} />
                  <Stack.Screen name="order/[id]" options={{ title: "Place Order" }} />
                  <Stack.Screen name="orders" options={{ title: "My Orders" }} />
                  <Stack.Screen name="chat/[userId]" options={{ headerShown: false }} />
                  <Stack.Screen name="review/[sellerId]" options={{ title: "Review" }} />
                </Stack>
              </ToastProvider>
            </SocketProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <InnerLayout />
    </AppThemeProvider>
  );
}
