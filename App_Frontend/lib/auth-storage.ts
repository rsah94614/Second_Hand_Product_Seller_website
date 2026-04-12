import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "campus_mitra_access_token";
const REFRESH_KEY = "campus_mitra_refresh_token";

const isWeb = Platform.OS === "web";

function getWebStorage() {
  if (!isWeb || typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const storage = getWebStorage();
    if (storage) {
      return storage.getItem(ACCESS_KEY);
    }
    return await SecureStore.getItemAsync(ACCESS_KEY);
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    const storage = getWebStorage();
    if (storage) {
      return storage.getItem(REFRESH_KEY);
    }
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    return null;
  }
}

export async function setAccessToken(token: string) {
  const storage = getWebStorage();
  if (storage) {
    storage.setItem(ACCESS_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(ACCESS_KEY, token);
}

export async function setTokens(access: string, refresh: string) {
  const storage = getWebStorage();
  if (storage) {
    storage.setItem(ACCESS_KEY, access);
    storage.setItem(REFRESH_KEY, refresh);
    return;
  }
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearTokens() {
  const storage = getWebStorage();
  if (storage) {
    storage.removeItem(ACCESS_KEY);
    storage.removeItem(REFRESH_KEY);
    return;
  }

  try {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
  } catch {
    /* ignore */
  }
  try {
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}
