import "../global.css";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { useMemo, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
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
  const queryClient = useMemo(() => new QueryClient(), []);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [fontsLoaded, fontError] = useFonts({
    "Outfit-Regular": Outfit_400Regular,
    "Outfit-Medium": Outfit_500Medium,
    "Outfit-SemiBold": Outfit_600SemiBold,
    "Outfit-Bold": Outfit_700Bold,
    "Outfit-Black": Outfit_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Use native iOS animation on iOS for correct back-swipe feel
  // On Android, slide_from_right is the standard
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
              <Stack.Screen
                name="devices"
                options={{ title: "Active Devices" }}
              />
              <Stack.Screen
                name="products"
                options={{ title: "Browse Products" }}
              />
              <Stack.Screen
                name="notifications"
                options={{ title: "Notifications" }}
              />
              <Stack.Screen
                name="my-products"
                options={{ title: "My Listings" }}
              />
              <Stack.Screen
                name="create-product"
                options={{ title: "Create Listing" }}
              />
              <Stack.Screen
                name="dashboard"
                options={{ title: "Dashboard" }}
              />
              <Stack.Screen
                name="wishlist"
                options={{ title: "Wishlist" }}
              />
            </Stack>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
