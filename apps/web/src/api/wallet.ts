import { api, buildQuery } from './client'
import type {
  CreatePayoutPayload,
  PaginatedResponse,
  PaginationParams,
  PayoutRequest,
  Wallet,
  WalletTransaction,
} from './types'

export const walletApi = {
  get: () => api.get<Wallet>('/wallet'),
  transactions: (params: PaginationParams = {}) =>
    api.get<PaginatedResponse<WalletTransaction>>(`/wallet/transactions${buildQuery(params)}`),
  requestPayout: (payload: CreatePayoutPayload) =>
    api.post<PayoutRequest>('/wallet/payouts', payload),
  payouts: (params: PaginationParams = {}) =>
    api.get<PaginatedResponse<PayoutRequest>>(`/wallet/payouts${buildQuery(params)}`),
}
