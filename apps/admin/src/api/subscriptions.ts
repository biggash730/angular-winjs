import { api } from "./client";
import type {
  PaginatedResponse,
  PaginationParams,
  SubscriptionDto,
  SubscriptionStatus,
} from "./types";

export interface SubscriptionListParams extends PaginationParams {
  status?: SubscriptionStatus | "";
}

export const subscriptionsApi = {
  list: (params: SubscriptionListParams = {}) =>
    api.get<PaginatedResponse<SubscriptionDto>>("/admin/subscriptions", params),
};
