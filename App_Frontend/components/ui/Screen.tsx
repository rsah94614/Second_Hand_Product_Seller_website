import React, { type ReactNode } from "react";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Appearance } from "react-native";

/**
 * Screen
 * 
 * Optimized to use Appearance instead of nativewind's useColorScheme
 * to prevent navigation context crashes during typing.
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

  React.useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setCurrentTheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);
  
  const edges: Edge[] = [];
  if (safeAreaTop) edges.push("top");
  if (safeAreaBottom) edges.push("bottom");

  return (
    <SafeAreaView edges={edges} className={`flex-1 bg-white dark:bg-slate-950 ${className}`}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      {children}
    </SafeAreaView>
  );
}
