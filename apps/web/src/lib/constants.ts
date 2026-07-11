import type { ProviderCategory } from '../api/types'

export const PROVIDER_CATEGORIES: { value: ProviderCategory; label: string }[] = [
  { value: 'Barber', label: 'Barber' },
  { value: 'Hairdresser', label: 'Hairdresser' },
  { value: 'MakeupArtist', label: 'Makeup Artist' },
  { value: 'Clinic', label: 'Clinic' },
  { value: 'Photographer', label: 'Photographer' },
  { value: 'CarRental', label: 'Car Rental' },
  { value: 'Other', label: 'Other' },
]

export function categoryLabel(category: ProviderCategory): string {
  return PROVIDER_CATEGORIES.find((c) => c.value === category)?.label ?? category
}

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const

export const TIMEZONES = [
  'UTC',
  'Africa/Lagos',
  'Africa/Accra',
  'Africa/Nairobi',
  'Africa/Johannesburg',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
]

export const BOOKING_STATUS_TONE: Record<string, 'brand' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  PendingPayment: 'warning',
  Confirmed: 'brand',
  Completed: 'success',
  Cancelled: 'danger',
  NoShow: 'neutral',
}
