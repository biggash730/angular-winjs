import { api } from "./client";
import type {
  PaginatedResponse,
  PaginationParams,
  PaymentDto,
  PaymentGateway,
  PaymentStatus,
} from "./types";

export interface PaymentListParams extends PaginationParams {
  gateway?: PaymentGateway | "";
  status?: PaymentStatus | "";
  purpose?: string;
}

export const paymentsApi = {
  list: (params: PaymentListParams = {}) =>
    api.get<PaginatedResponse<PaymentDto>>("/admin/payments", params),
};
