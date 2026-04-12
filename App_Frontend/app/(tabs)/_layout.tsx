import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: isDark ? "#64748b" : "#94a3b8",
        headerStyle: {
          backgroundColor: "#4f46e5",
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTitleStyle: { 
          fontFamily: "Outfit-Bold", 
          fontSize: 20,
          color: "#ffffff"
        },
        tabBarStyle: {
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          borderTopWidth: 1,
          borderTopColor: isDark ? "#1e293b" : "#f1f5f9",
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: "Outfit-Medium",
          fontSize: 11,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false, // Home has custom header
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
