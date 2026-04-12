import { Platform } from "react-native";

const trimSlash = (u: string) => u.replace(/\/$/, "");

const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
const defaultDev =
  Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://127.0.0.1:5000";

export const API_BASE_URL = trimSlash(fromEnv || defaultDev);

const socketEnv = process.env.EXPO_PUBLIC_SOCKET_URL?.trim();
export const SOCKET_URL = socketEnv ? trimSlash(socketEnv) : API_BASE_URL;

export const MOBILE_CLIENT_HEADER = { "X-Client": "mobile" } as const;
