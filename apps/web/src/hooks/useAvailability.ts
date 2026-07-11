import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { availabilityApi } from '../api/availability'
import type { CreateTimeOffPayload, UpdateWorkingHoursPayload } from '../api/availability'

export const availabilityKeys = {
  hours: ['availability', 'hours'] as const,
  timeOff: ['availability', 'timeoff'] as const,
  slots: (slug: string, serviceId: string, date: string) =>
    ['availability', 'slots', slug, serviceId, date] as const,
}

export function useWorkingHours() {
  return useQuery({
    queryKey: availabilityKeys.hours,
    queryFn: availabilityApi.list,
  })
}

export function useUpdateWorkingHours() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateWorkingHoursPayload) => availabilityApi.update(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityKeys.hours }),
  })
}

export function useTimeOffList() {
  return useQuery({
    queryKey: availabilityKeys.timeOff,
    queryFn: availabilityApi.listTimeOff,
  })
}

export function useCreateTimeOff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTimeOffPayload) => availabilityApi.createTimeOff(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityKeys.timeOff }),
  })
}

export function useDeleteTimeOff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => availabilityApi.removeTimeOff(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityKeys.timeOff }),
  })
}

export function usePublicSlots(slug: string | undefined, serviceId: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: availabilityKeys.slots(slug ?? '', serviceId ?? '', date ?? ''),
    queryFn: () => availabilityApi.publicSlots(slug as string, serviceId as string, date as string),
    enabled: Boolean(slug && serviceId && date),
  })
}
