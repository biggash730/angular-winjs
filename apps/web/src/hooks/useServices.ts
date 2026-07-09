import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '../api/services'
import type { CreateServicePayload, UpdateServicePayload } from '../api/services'

export const serviceKeys = {
  all: ['services'] as const,
}

export function useServices() {
  return useQuery({
    queryKey: serviceKeys.all,
    queryFn: servicesApi.list,
  })
}

export function useCreateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateServicePayload) => servicesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
  })
}

export function useUpdateService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateServicePayload }) =>
      servicesApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
  })
}

export function useDeleteService() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => servicesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
  })
}
