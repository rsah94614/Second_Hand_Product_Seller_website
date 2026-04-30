import axios from "axios";
import { API_BASE_URL } from "../config";
import * as storage from "../auth-storage";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000, // 15s timeout — prevents infinite loading on poor networks
});

api.interceptors.request.use(async (config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  const token = await storage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Refresh mutex ──────────────────────────────────────────────────────────────
// Ensures that if multiple 401s fire concurrently, only ONE refresh call is made.
// All other retries wait for the same promise.
let refreshingPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };
    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    const url = String(originalRequest.url || "");
    if (url.includes("/api/auth/refresh") || url.includes("/api/auth/login")) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) {
      await storage.clearTokens();
      return Promise.reject(error);
    }

    try {
      // If a refresh is already in flight, wait for it instead of making a new one
      if (!refreshingPromise) {
        refreshingPromise = axios
          .post<{ token: string }>(
            `${API_BASE_URL}/api/auth/refresh`,
            { refreshToken },
            { headers: { "Content-Type": "application/json" } }
          )
          .then(async ({ data }) => {
            await storage.setAccessToken(data.token);
            return data.token;
          })
          .finally(() => {
            refreshingPromise = null;
          });
      }

      const newToken = await refreshingPromise;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError: any) {
      refreshingPromise = null;
      const status = refreshError?.response?.status;
      if (status === 401 || status === 403) {
        await storage.clearTokens();
      }
      return Promise.reject(error);
    }
  }
);
