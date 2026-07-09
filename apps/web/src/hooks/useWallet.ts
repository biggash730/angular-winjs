import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { walletApi } from '../api/wallet'
import type { CreatePayoutPayload, PaginationParams } from '../api/types'

export const walletKeys = {
  summary: ['wallet', 'summary'] as const,
  transactions: (params: PaginationParams) => ['wallet', 'transactions', params] as const,
  payouts: (params: PaginationParams) => ['wallet', 'payouts', params] as const,
}

export function useWallet() {
  return useQuery({
    queryKey: walletKeys.summary,
    queryFn: walletApi.get,
  })
}

export function useWalletTransactions(params: PaginationParams = {}) {
  return useQuery({
    queryKey: walletKeys.transactions(params),
    queryFn: () => walletApi.transactions(params),
  })
}

export function usePayouts(params: PaginationParams = {}) {
  return useQuery({
    queryKey: walletKeys.payouts(params),
    queryFn: () => walletApi.payouts(params),
  })
}

export function useRequestPayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePayoutPayload) => walletApi.requestPayout(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}
