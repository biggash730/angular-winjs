import { api, buildQuery } from './client'
import type { AvailableSlot, TimeOff, WorkingHours } from './types'

export type UpdateWorkingHoursPayload = Pick<
  WorkingHours,
  'dayOfWeek' | 'startTime' | 'endTime' | 'isClosed'
>[]

export interface CreateTimeOffPayload {
  startAt: string
  endAt: string
  reason?: string
}

export const availabilityApi = {
  list: () => api.get<WorkingHours[]>('/availability'),
  update: (payload: UpdateWorkingHoursPayload) =>
    api.put<WorkingHours[]>('/availability', payload),
  createTimeOff: (payload: CreateTimeOffPayload) => api.post<TimeOff>('/timeoff', payload),
  removeTimeOff: (id: string) => api.delete<void>(`/timeoff/${id}`),
  listTimeOff: () => api.get<TimeOff[]>('/timeoff'),
  publicSlots: (slug: string, serviceId: string, date: string) =>
    api.get<AvailableSlot[]>(`/public/providers/${slug}/slots${buildQuery({ serviceId, date })}`, {
      auth: false,
    }),
}
