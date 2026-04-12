import "../global.css";
import { Stack } from "expo-router";
import { useMemo, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
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

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <Stack
              screenOptions={{
                headerTitleStyle: { fontFamily: "Outfit-SemiBold" },
                headerTintColor: "#ffffff",
                headerStyle: {
                  backgroundColor: "#4f46e5",
                },
                contentStyle: {
                  backgroundColor: isDark ? "#020617" : "#f8fafc",
                },
                animation: "slide_from_right",
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
            </Stack>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
