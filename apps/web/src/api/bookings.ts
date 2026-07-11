import { api, buildQuery } from './client'
import type {
  Booking,
  BookingListParams,
  CreatePublicBookingPayload,
  CreatePublicBookingResponse,
  PaginatedResponse,
} from './types'

export const bookingsApi = {
  list: (params: BookingListParams = {}) =>
    api.get<PaginatedResponse<Booking>>(`/bookings${buildQuery(params)}`),
  get: (id: string) => api.get<Booking>(`/bookings/${id}`),
  confirm: (id: string) => api.post<Booking>(`/bookings/${id}/confirm`),
  cancel: (id: string) => api.post<Booking>(`/bookings/${id}/cancel`),
  complete: (id: string) => api.post<Booking>(`/bookings/${id}/complete`),
  createPublic: (payload: CreatePublicBookingPayload) =>
    api.post<CreatePublicBookingResponse>('/public/bookings', payload, { auth: false }),
  getPublic: (id: string) => api.get<Booking>(`/public/bookings/${id}`, { auth: false }),
}
