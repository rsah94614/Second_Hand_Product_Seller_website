import axios from "axios";
import { API_BASE_URL } from "../config";
import * as storage from "../auth-storage";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s — crucial for Render cold starts and mobile uploads
});

api.interceptors.request.use(async (config) => {
  const isFormData = config.data instanceof FormData || 
                    (config.data && typeof config.data === 'object' && typeof config.data.append === 'function');

  if (isFormData) {
    // In React Native, we must NOT set Content-Type for FormData to let Axios/Fetch set the boundary
    delete config.headers["Content-Type"];
    config.timeout = 180000; // 3 minutes for large multi-image uploads
  } else {
    config.headers["Content-Type"] = "application/json";
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
    if (error.message === "Network Error") {
      console.error("[API] Network Error details:", {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        timeout: error.config?.timeout,
      });
    }

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
