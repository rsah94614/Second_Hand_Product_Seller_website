const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim().replace(/\/$/, '');

if (import.meta.env.PROD && !configuredBackendUrl) {
  throw new Error('VITE_BACKEND_URL is required for production builds.');
}

export const API_BASE_URL = configuredBackendUrl || 'http://localhost:5000';

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL?.replace(/\/$/, '') || API_BASE_URL;
