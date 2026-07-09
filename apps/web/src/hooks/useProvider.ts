import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { providersApi } from '../api/providers'
import type { UpdateProviderPayload } from '../api/providers'

export const providerKeys = {
  me: ['provider', 'me'] as const,
  public: (slug: string) => ['provider', 'public', slug] as const,
}

export function useMyProvider(enabled = true) {
  return useQuery({
    queryKey: providerKeys.me,
    queryFn: providersApi.me,
    enabled,
  })
}

export function useUpdateProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateProviderPayload) => providersApi.updateMe(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(providerKeys.me, data)
    },
  })
}

export function usePublicProvider(slug: string | undefined) {
  return useQuery({
    queryKey: providerKeys.public(slug ?? ''),
    queryFn: () => providersApi.publicBySlug(slug as string),
    enabled: Boolean(slug),
    retry: 0,
  })
}
