import { api } from "./client";
import type { BookingDto, BookingStatus, PaginatedResponse, PaginationParams } from "./types";

export interface BookingListParams extends PaginationParams {
  status?: BookingStatus | "";
  from?: string;
  to?: string;
  search?: string;
}

export const bookingsApi = {
  list: (params: BookingListParams = {}) =>
    api.get<PaginatedResponse<BookingDto>>("/admin/bookings", params),
};
