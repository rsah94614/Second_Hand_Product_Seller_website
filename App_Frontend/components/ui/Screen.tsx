import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import type { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";

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
  const { colorScheme } = useColorScheme();
  const edges: Edge[] = [];
  if (safeAreaTop) edges.push("top");
  if (safeAreaBottom) edges.push("bottom");
  return (
    <SafeAreaView edges={edges} className={`flex-1 bg-slate-50 dark:bg-slate-950 ${className}`}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      {children}
    </SafeAreaView>
  );
}
