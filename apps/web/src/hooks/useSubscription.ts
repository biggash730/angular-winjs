import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { subscriptionsApi } from '../api/subscriptions'
import type { SubscriptionCheckoutPayload } from '../api/types'

export const subscriptionKeys = {
  me: ['subscription', 'me'] as const,
}

export function useMySubscription() {
  return useQuery({
    queryKey: subscriptionKeys.me,
    queryFn: subscriptionsApi.me,
  })
}

export function useSubscriptionCheckout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SubscriptionCheckoutPayload) => subscriptionsApi.checkout(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionKeys.me }),
  })
}
