import { api } from "./client";
import type { DashboardStatsDto } from "./types";

export const dashboardApi = {
  stats: () => api.get<DashboardStatsDto>("/admin/dashboard/stats"),
};
