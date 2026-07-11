import { api } from './client'
import type { ProviderProfile, PublicProviderPayload } from './types'

export type UpdateProviderPayload = Partial<
  Pick<
    ProviderProfile,
    | 'businessName'
    | 'slug'
    | 'category'
    | 'bio'
    | 'logoUrl'
    | 'coverImageUrl'
    | 'brandColor'
    | 'address'
    | 'phone'
    | 'timezone'
  >
>

export const providersApi = {
  me: () => api.get<ProviderProfile>('/providers/me'),
  updateMe: (payload: UpdateProviderPayload) =>
    api.put<ProviderProfile>('/providers/me', payload),
  publicBySlug: (slug: string) =>
    api.get<PublicProviderPayload>(`/public/providers/${slug}`, { auth: false }),
}
