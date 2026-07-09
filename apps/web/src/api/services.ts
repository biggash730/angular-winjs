import { api } from './client'
import type { Service } from './types'

export type CreateServicePayload = Pick<
  Service,
  'name' | 'description' | 'durationMinutes' | 'price' | 'depositPercentage' | 'isActive'
>

export type UpdateServicePayload = Partial<CreateServicePayload>

export const servicesApi = {
  list: () => api.get<Service[]>('/services'),
  create: (payload: CreateServicePayload) => api.post<Service>('/services', payload),
  update: (id: string, payload: UpdateServicePayload) =>
    api.put<Service>(`/services/${id}`, payload),
  remove: (id: string) => api.delete<void>(`/services/${id}`),
}
