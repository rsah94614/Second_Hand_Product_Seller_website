import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const THEME_KEY = "campus_mitra_color_scheme";

const isWeb = Platform.OS === "web";

/** Save user's explicit theme preference (persists across restarts) */
export async function saveThemePreference(scheme: "light" | "dark" | "system"): Promise<void> {
  try {
    if (isWeb) {
      if (typeof window !== "undefined") localStorage.setItem(THEME_KEY, scheme);
      return;
    }
    await SecureStore.setItemAsync(THEME_KEY, scheme);
  } catch {
    /* ignore */
  }
}

/** Load saved theme preference, returns null if not set (= follow system) */
export async function loadThemePreference(): Promise<"light" | "dark" | "system" | null> {
  try {
    if (isWeb) {
      if (typeof window !== "undefined") {
        const v = localStorage.getItem(THEME_KEY);
        return (v as "light" | "dark" | "system") ?? null;
      }
      return null;
    }
    const v = await SecureStore.getItemAsync(THEME_KEY);
    return (v as "light" | "dark" | "system") ?? null;
  } catch {
    return null;
  }
}

/** Remove saved preference (revert to system) */
export async function clearThemePreference(): Promise<void> {
  try {
    if (isWeb) {
      if (typeof window !== "undefined") localStorage.removeItem(THEME_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(THEME_KEY);
  } catch {
    /* ignore */
  }
}
