import { api } from "./client";
import type {
  PaginatedResponse,
  PaginationParams,
  PayoutRequestDto,
  PayoutStatus,
} from "./types";

export interface PayoutListParams extends PaginationParams {
  status?: PayoutStatus | "";
}

export const payoutsApi = {
  list: (params: PayoutListParams = {}) =>
    api.get<PaginatedResponse<PayoutRequestDto>>("/admin/payouts", params),
  approve: (id: string) =>
    api.post<PayoutRequestDto>(`/admin/payouts/${id}/approve`),
  reject: (id: string) =>
    api.post<PayoutRequestDto>(`/admin/payouts/${id}/reject`),
};
