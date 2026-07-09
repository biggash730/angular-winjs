import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bookingsApi } from '../api/bookings'
import type { BookingListParams, CreatePublicBookingPayload } from '../api/types'

export const bookingKeys = {
  list: (params: BookingListParams) => ['bookings', 'list', params] as const,
  detail: (id: string) => ['bookings', 'detail', id] as const,
  publicDetail: (id: string) => ['bookings', 'public', id] as const,
}

export function useBookings(params: BookingListParams = {}) {
  return useQuery({
    queryKey: bookingKeys.list(params),
    queryFn: () => bookingsApi.list(params),
  })
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: bookingKeys.detail(id ?? ''),
    queryFn: () => bookingsApi.get(id as string),
    enabled: Boolean(id),
  })
}

export function usePublicBooking(id: string | undefined) {
  return useQuery({
    queryKey: bookingKeys.publicDetail(id ?? ''),
    queryFn: () => bookingsApi.getPublic(id as string),
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.status === 'PendingPayment' ? 3000 : false),
  })
}

function useBookingAction(action: (id: string) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => action(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}

export function useConfirmBooking() {
  return useBookingAction(bookingsApi.confirm)
}

export function useCancelBooking() {
  return useBookingAction(bookingsApi.cancel)
}

export function useCompleteBooking() {
  return useBookingAction(bookingsApi.complete)
}

export function useCreatePublicBooking() {
  return useMutation({
    mutationFn: (payload: CreatePublicBookingPayload) => bookingsApi.createPublic(payload),
  })
}
