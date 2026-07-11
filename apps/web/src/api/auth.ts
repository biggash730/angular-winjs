import { api } from './client'
import type { AppUser, AuthTokens, LoginPayload, RegisterPayload } from './types'

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<AuthTokens>('/auth/register', payload, { auth: false }),
  login: (payload: LoginPayload) => api.post<AuthTokens>('/auth/login', payload, { auth: false }),
  refresh: (refreshToken: string) =>
    api.post<AuthTokens>('/auth/refresh', { refreshToken }, { auth: false }),
  me: () => api.get<AppUser>('/auth/me'),
}
