import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import * as storage from '../auth-storage';

export const WEB_CLIENT_HEADER = { 'X-Client': 'web' };

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true,
});

export const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...WEB_CLIENT_HEADER,
  },
  timeout: 30000,
  withCredentials: true,
});

let refreshPromise = null;
let globalsConfigured = false;
let onUnauthorizedCallback = null;

export const setUnauthorizedCallback = (callback) => {
  onUnauthorizedCallback = callback;
};

const applyRequestAuth = async (config) => {
  const nextConfig = config;

  if (nextConfig.data instanceof FormData) {
    if (nextConfig.headers) {
      delete nextConfig.headers['Content-Type'];
    }
    nextConfig.timeout = 120000;
  }

  const token = await storage.getAccessToken();
  if (token) {
    nextConfig.headers = nextConfig.headers || {};
    nextConfig.headers.Authorization = `Bearer ${token}`;
  }

  return nextConfig;
};

const refreshAccessToken = async () => {
  const refreshToken = await storage.getRefreshToken();
  if (!refreshToken) {
    await storage.clearTokens();
    throw new Error('Missing refresh token');
  }

  if (!refreshPromise) {
    refreshPromise = authApi
      .post('/api/auth/refresh', { refreshToken })
      .then(async ({ data }) => {
        await storage.setTokens(data.token, data.refreshToken || refreshToken);
        return data.token;
      })
      .catch(async (error) => {
        await storage.clearTokens();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const attachResponseInterceptor = (instance) => {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const status = error.response?.status;
      const url = String(originalRequest?.url || '');

      if (!originalRequest || status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      if (
        url.includes('/api/auth/login') ||
        url.includes('/api/auth/register') ||
        url.includes('/api/auth/refresh') ||
        url.includes('/api/auth/forgot-password') ||
        url.includes('/api/auth/reset-password')
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const nextToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${nextToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
        return Promise.reject(refreshError);
      }
    }
  );
};

api.interceptors.request.use(applyRequestAuth);
authApi.interceptors.request.use(applyRequestAuth);
attachResponseInterceptor(api);

export const configureGlobalAxiosDefaults = () => {
  if (globalsConfigured) {
    return;
  }

  globalsConfigured = true;
  axios.defaults.baseURL = API_BASE_URL;
  axios.defaults.withCredentials = true;
  axios.interceptors.request.use(applyRequestAuth);
  attachResponseInterceptor(axios);
};
