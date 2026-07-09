import { api } from "./api";
import { ApiResponse, LoginPayload, RegisterPayload, User } from "../types";

export const authService = {
  async login(payload: LoginPayload): Promise<User> {
    const { data } = await api.post<ApiResponse<User> & { token: string }>(
      "/auth/login",
      payload
    );
    if (data.token) localStorage.setItem("token", data.token);
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<User> {
    const { data } = await api.post<ApiResponse<User> & { token: string }>(
      "/auth/register",
      payload
    );
    if (data.token) localStorage.setItem("token", data.token);
    return data.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
    localStorage.removeItem("token");
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>("/auth/me");
    return data.data;
  },

  async updateProfile(payload: { name?: string; email?: string; currentPassword: string }): Promise<User> {
    const { data } = await api.put<ApiResponse<User>>("/auth/profile", payload);
    return data.data;
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    await api.put("/auth/password", payload);
  },
};
