import axios from "axios";
import { API_BASE_URL } from "../config";
import * as storage from "../auth-storage";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
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
      const { data } = await axios.post<{ token: string }>(
        `${API_BASE_URL}/api/auth/refresh`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } }
      );
      await storage.setAccessToken(data.token);
      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      return api(originalRequest);
    } catch (refreshError) {
      const status = refreshError?.response?.status;
      if (status === 401 || status === 403) {
        await storage.clearTokens();
      }
      return Promise.reject(error);
    }
  }
);
