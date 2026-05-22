import { router, Stack } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { Loading } from "../../components/Loading";
import { useEffect } from "react";
import { View, useColorScheme } from "react-native";

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/(auth)/login");
    } else if (user.role !== "admin") {
      router.replace("/");
    }
  }, [loading, user]);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <Loading />
      </View>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950">
        <Loading />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerTitleStyle: { fontFamily: "Outfit-SemiBold", fontSize: 18 },
        headerTintColor: isDark ? "#ffffff" : "#1e293b",
        headerStyle: {
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
        },
        contentStyle: {
          backgroundColor: isDark ? "#020617" : "#f8fafc",
        },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Admin" }} />
      <Stack.Screen name="users" options={{ title: "Users" }} />
      <Stack.Screen name="products" options={{ title: "Products" }} />
      <Stack.Screen name="categories" options={{ title: "Categories" }} />
      <Stack.Screen name="orders" options={{ title: "Orders" }} />
      <Stack.Screen name="reports" options={{ title: "Reports" }} />
      <Stack.Screen name="audit" options={{ title: "Audit Logs" }} />
      <Stack.Screen name="moderation-queue" options={{ title: "Moderation Queue" }} />
      <Stack.Screen name="seller-verifications" options={{ title: "Seller Verifications" }} />
      <Stack.Screen name="bulk-actions" options={{ title: "Bulk Actions" }} />
      <Stack.Screen name="activity" options={{ title: "Activity Timeline" }} />
      <Stack.Screen name="sales-dashboard" options={{ title: "Sales Dashboard" }} />
    </Stack>
  );
}
