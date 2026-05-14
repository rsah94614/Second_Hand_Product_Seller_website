import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import { useColorScheme } from "nativewind";
import { loadThemePreference, saveThemePreference } from "../lib/theme-storage";

export type ThemeType = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  activeScheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>("system");
  const [systemScheme, setSystemScheme] = useState<"light" | "dark">(
    Appearance.getColorScheme() === "dark" ? "dark" : "light"
  );

  // Load saved preference on mount
  useEffect(() => {
    loadThemePreference().then((saved) => {
      if (saved) {
        setThemeState(saved);
        setColorScheme(saved);
      } else {
        setColorScheme("system");
      }
    });

    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === "dark" ? "dark" : "light");
    });
    return () => sub.remove();
  }, [setColorScheme]);

  const handleSetTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    setColorScheme(newTheme);
    await saveThemePreference(newTheme);
  };

  // Determine the resolved active scheme (for navigation and non-tailwind elements)
  const activeScheme = theme === "system" ? systemScheme : theme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, activeScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within an AppThemeProvider");
  }
  return context;
}
