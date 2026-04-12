import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { api } from "../lib/api/client";
import { API_BASE_URL } from "../lib/config";
import {
  forgotPasswordApi,
  loginUser,
  registerUser,
  resetPasswordApi,
} from "../lib/api/auth";
import { updateUserProfile } from "../lib/api/users";
import * as storage from "../lib/auth-storage";
import type { AuthUser } from "../lib/types";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (payload: Record<string, unknown>) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
  updateProfile: (payload: Record<string, unknown>) => Promise<void>;
  isUser: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const response = (error as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data;
  if (Array.isArray(response?.errors) && response.errors.length > 0) {
    return response.errors.join("\n");
  }
  return response?.message || fallback;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: AuthUser }>("/api/auth/me");
      setUser(data.user);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        await storage.clearTokens();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await storage.getAccessToken();
      const refreshToken = await storage.getRefreshToken();

      if (token) {
        await fetchUser();
      } else if (refreshToken) {
        try {
          const { data } = await axios.post<{ token: string }>(
            `${API_BASE_URL}/api/auth/refresh`,
            { refreshToken },
            { headers: { "Content-Type": "application/json" } }
          );
          await storage.setAccessToken(data.token);
          await fetchUser();
        } catch {
          await storage.clearTokens();
          setUser(null);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    })();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await loginUser(email, password);
      await storage.setTokens(data.token, data.refreshToken);
      setUser(data.user);
      return { success: true };
    } catch (e: unknown) {
      const msg = getApiErrorMessage(e, "Login failed");
      return { success: false, message: msg };
    }
  }, []);

  const register = useCallback(async (payload: Record<string, unknown>) => {
    try {
      const data = await registerUser(payload);
      return { success: true, message: data.message || "Registration successful" };
    } catch (e: unknown) {
      const msg = getApiErrorMessage(e, "Registration failed");
      return { success: false, message: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    const refresh = await storage.getRefreshToken();
    try {
      if (refresh) {
        await api.post("/api/auth/logout", { refreshToken: refresh });
      }
    } catch {
      /* ignore */
    }
    await storage.clearTokens();
    setUser(null);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      const res = await forgotPasswordApi(email);
      return { success: true, message: res.message };
    } catch (e: unknown) {
      const msg = getApiErrorMessage(e, "Failed to send reset link.");
      return { success: false, message: msg };
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      const res = await resetPasswordApi(token, newPassword);
      return { success: true, message: res.message };
    } catch (e: unknown) {
      const msg = getApiErrorMessage(e, "Failed to reset password.");
      return { success: false, message: msg };
    }
  }, []);

  const updateProfile = useCallback(async (payload: Record<string, unknown>) => {
    if (!user) return;
    await updateUserProfile(user.id, payload);
    await fetchUser();
  }, [user, fetchUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      forgotPassword,
      resetPassword,
      refreshUser: fetchUser,
      updateProfile,
      isUser: user?.role === "user",
      isAdmin: user?.role === "admin",
    }),
    [user, loading, login, register, logout, forgotPassword, resetPassword, fetchUser, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
