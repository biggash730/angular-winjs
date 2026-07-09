import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppUser } from '../api/types'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AppUser | null
  hasOnboarded: boolean
  setSession: (session: { accessToken: string; refreshToken: string; user: AppUser }) => void
  setUser: (user: AppUser) => void
  setOnboarded: (value: boolean) => void
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hasOnboarded: false,
      setSession: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),
      setUser: (user) => set({ user }),
      setOnboarded: (value) => set({ hasOnboarded: value }),
      setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null, hasOnboarded: false }),
    }),
    {
      name: 'bookme-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        hasOnboarded: state.hasOnboarded,
      }),
    },
  ),
)

/** Read the current auth state outside of React (used by the API client). */
export function getAuthState() {
  return useAuthStore.getState()
}
