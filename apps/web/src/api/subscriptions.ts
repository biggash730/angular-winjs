import { api } from './client'
import type {
  ProviderSubscription,
  SubscriptionCheckoutPayload,
  SubscriptionCheckoutResponse,
} from './types'

export const subscriptionsApi = {
  me: () => api.get<ProviderSubscription | null>('/subscriptions/me'),
  checkout: (payload: SubscriptionCheckoutPayload) =>
    api.post<SubscriptionCheckoutResponse>('/subscriptions/checkout', payload),
}
