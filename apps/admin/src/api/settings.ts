import { api } from "./client";
import type { PlatformSettingsDto } from "./types";

export const settingsApi = {
  get: () => api.get<PlatformSettingsDto>("/admin/settings"),
  update: (payload: Partial<PlatformSettingsDto>) =>
    api.put<PlatformSettingsDto>("/admin/settings", payload),
};
