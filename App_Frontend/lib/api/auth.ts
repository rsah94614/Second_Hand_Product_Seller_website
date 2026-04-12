import axios from "axios";
import { API_BASE_URL, MOBILE_CLIENT_HEADER } from "../config";
import type { AuthUser } from "../types";

const authAxios = axios.create({
  headers: { ...MOBILE_CLIENT_HEADER },
});

export type LoginResponse = {
  message: string;
  token: string;
  refreshToken: string;
  user: AuthUser;
};

export const loginUser = (email: string, password: string) =>
  authAxios
    .post<LoginResponse>(`${API_BASE_URL}/api/auth/login`, { email, password })
    .then((r) => r.data);

export const registerUser = (payload: Record<string, unknown>) =>
  authAxios
    .post<LoginResponse>(`${API_BASE_URL}/api/auth/register`, payload)
    .then((r) => r.data);

export const forgotPasswordApi = (email: string) =>
  axios
    .post<{ message: string }>(`${API_BASE_URL}/api/auth/forgot-password`, { email })
    .then((r) => r.data);

export const resetPasswordApi = (token: string, newPassword: string) =>
  axios
    .post<{ message: string }>(`${API_BASE_URL}/api/auth/reset-password`, {
      token,
      newPassword,
    })
    .then((r) => r.data);
