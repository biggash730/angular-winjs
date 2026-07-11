import { getAuthState, useAuthStore } from '../store/auth'
import type { AuthTokens } from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  auth?: boolean
  /** Internal: set when this request is a retry after a token refresh. */
  _retried?: boolean
}

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = getAuthState()
  if (!refreshToken) return null

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        if (!res.ok) {
          useAuthStore.getState().clear()
          return null
        }
        const data = (await res.json()) as AuthTokens
        useAuthStore.getState().setSession(data)
        return data.accessToken
      } catch {
        useAuthStore.getState().clear()
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, _retried, ...rest } = options

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  }

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  if (auth) {
    const { accessToken } = getAuthState()
    if (accessToken) {
      finalHeaders.Authorization = `Bearer ${accessToken}`
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body:
      body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  })

  if (res.status === 401 && auth && !_retried) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return apiFetch<T>(path, { ...options, _retried: true })
    }
  }

  if (!res.ok) {
    let message = res.statusText
    let parsedBody: unknown
    try {
      parsedBody = await res.json()
      if (parsedBody && typeof parsedBody === 'object' && 'message' in parsedBody) {
        message = String((parsedBody as { message?: unknown }).message ?? message)
      }
    } catch {
      // response had no JSON body
    }
    throw new ApiError(res.status, message || `Request failed with ${res.status}`, parsedBody)
  }

  if (res.status === 204) {
    return undefined as T
  }

  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
}

export function buildQuery(params: object): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}
