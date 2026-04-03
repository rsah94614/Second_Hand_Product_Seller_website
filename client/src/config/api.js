export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:5000';

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL?.replace(/\/$/, '') || API_BASE_URL;
