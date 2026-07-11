import { api } from "./client";
import type {
  PaginatedResponse,
  PaginationParams,
  ProviderDetail,
  ProviderSummary,
} from "./types";

export interface ProviderListParams extends PaginationParams {
  search?: string;
  category?: string;
  isActive?: boolean;
  subscriptionStatus?: string;
}

export const providersApi = {
  list: (params: ProviderListParams = {}) =>
    api.get<PaginatedResponse<ProviderSummary>>("/admin/providers", params),
  get: (id: string) => api.get<ProviderDetail>(`/admin/providers/${id}`),
  suspend: (id: string) =>
    api.post<ProviderDetail>(`/admin/providers/${id}/suspend`),
  activate: (id: string) =>
    api.post<ProviderDetail>(`/admin/providers/${id}/activate`),
};
