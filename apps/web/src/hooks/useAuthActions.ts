import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import type { LoginPayload, RegisterPayload } from '../api/types'
import { useAuthStore } from '../store/auth'

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession)
  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => setSession(data),
  })
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession)
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data) => setSession(data),
  })
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return () => {
    clear()
    queryClient.clear()
    navigate('/login')
  }
}
