import React, { type ReactNode } from "react";
import { View, Appearance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

/**
 * Screen
 * 
 * Optimized to use Appearance instead of nativewind's useColorScheme
 * to prevent navigation context crashes during typing.
 * Uses View + useSafeAreaInsets instead of SafeAreaView to prevent 
 * native Android Fabric layout transitions from crashing (addViewAt error)
 * during unauthenticated redirect loops.
 */
export function Screen({
  children,
  className = "",
  safeAreaTop = true,
  safeAreaBottom = true,
}: {
  children: ReactNode;
  className?: string;
  safeAreaTop?: boolean;
  safeAreaBottom?: boolean;
}) {
  const [currentTheme, setCurrentTheme] = React.useState(Appearance.getColorScheme());
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setCurrentTheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  return (
    <View 
      style={{ 
        paddingTop: safeAreaTop ? insets.top : 0,
        paddingBottom: safeAreaBottom ? insets.bottom : 0
      }}
      className={`flex-1 bg-white dark:bg-slate-950 ${className}`}
    >
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      {children}
    </View>
  );
}
