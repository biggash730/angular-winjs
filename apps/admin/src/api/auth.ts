import { api } from "./client";
import type { AppUser, AuthResponse } from "./types";

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", payload, { skipAuth: true }),
  refresh: (refreshToken: string) =>
    api.post<AuthResponse>(
      "/auth/refresh",
      { refreshToken },
      { skipAuth: true, skipRefresh: true },
    ),
  me: () => api.get<AppUser>("/auth/me"),
};
