import axios from "axios";
import { API_BASE_URL } from "../config";
import * as storage from "../auth-storage";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const isFormData =
    config.data instanceof FormData ||
    (config.data && typeof config.data === "object" && typeof config.data.append === "function");

  config.headers = config.headers || {};

  if (isFormData) {
    // Let the native layer generate the multipart boundary.
    if (typeof (config.headers as any).setContentType === "function") {
      (config.headers as any).setContentType(undefined);
    }
    delete (config.headers as Record<string, unknown>)["Content-Type"];
    delete (config.headers as Record<string, unknown>)["content-type"];
    config.timeout = 180000;
  } else {
    if (typeof (config.headers as any).setContentType === "function") {
      (config.headers as any).setContentType("application/json");
    } else {
      (config.headers as Record<string, unknown>)["Content-Type"] = "application/json";
    }
  }

  const token = await storage.getAccessToken();
  if (token) {
    (config.headers as Record<string, unknown>).Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshingPromise: Promise<string> | null = null;

const refreshAccessToken = async () => {
  const refreshToken = await storage.getRefreshToken();
  if (!refreshToken) {
    await storage.clearTokens();
    throw new Error("Missing refresh token");
  }

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

  return refreshingPromise;
};

const parseFetchResponse = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const buildUploadHeaders = async () => {
  const token = await storage.getAccessToken();
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const buildUploadError = (response: Response, data: any) => {
  const error = new Error(data?.message || `Request failed with status ${response.status}`);
  (error as any).response = {
    status: response.status,
    data,
  };
  return error;
};

export const uploadFormData = async <T = any>(
  path: string,
  formData: FormData,
  method: "POST" | "PUT" = "POST"
): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;
  const send = async () =>
    fetch(url, {
      method,
      headers: await buildUploadHeaders(),
      body: formData,
    });

  let response = await send();
  let data = await parseFetchResponse(response);

  if (response.status === 401) {
    try {
      await refreshAccessToken();
      response = await send();
      data = await parseFetchResponse(response);
    } catch {
      await storage.clearTokens();
    }
  }

  if (!response.ok) {
    throw buildUploadError(response, data);
  }

  return data as T;
};

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
      if (!refreshingPromise) {
        refreshingPromise = refreshAccessToken();
      }

      const newToken = await refreshingPromise;
      originalRequest.headers = originalRequest.headers || {};
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
