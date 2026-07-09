// Shared DTO types matching the BookingSaas REST API contract (see ARCHITECTURE.md).
// Keep in lock-step with the backend's Application-layer DTOs.

export type Role = 'Provider' | 'Client' | 'Admin' | 'SuperAdmin'

export type ProviderCategory =
  | 'Barber'
  | 'Hairdresser'
  | 'MakeupArtist'
  | 'Clinic'
  | 'Photographer'
  | 'CarRental'
  | 'Other'

export type SubscriptionInterval = 'Monthly'

export type SubscriptionStatus = 'Trialing' | 'Active' | 'PastDue' | 'Canceled'

export type PaymentGateway = 'Stripe' | 'Paystack'

export type BookingStatus = 'PendingPayment' | 'Confirmed' | 'Cancelled' | 'Completed' | 'NoShow'

export type PaymentPurpose = 'BookingDeposit' | 'Subscription' | 'Payout'

export type PaymentStatus = 'Pending' | 'Succeeded' | 'Failed' | 'Refunded'

export type WalletTransactionType =
  | 'DepositHeld'
  | 'DepositReleased'
  | 'Refund'
  | 'PayoutDebit'
  | 'PayoutFee'

export type PayoutMethod = 'BankTransfer' | 'MobileMoney'

export type PayoutStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed'

export interface AppUser {
  id: string
  email: string
  role: Role
  createdAt: string
}

export interface ProviderProfile {
  id: string
  userId: string
  businessName: string
  slug: string
  category: ProviderCategory
  bio: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  brandColor: string | null
  address: string | null
  phone: string | null
  timezone: string
  isActive: boolean
}

export interface SubscriptionPlan {
  id: string
  name: string
  priceUsd: number
  interval: SubscriptionInterval
}

export interface ProviderSubscription {
  id: string
  providerId: string
  gateway: PaymentGateway
  gatewaySubscriptionId: string | null
  status: SubscriptionStatus
  currentPeriodEnd: string | null
}

export interface Service {
  id: string
  providerId: string
  name: string
  description: string | null
  durationMinutes: number
  price: number
  depositPercentage: number
  isActive: boolean
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface WorkingHours {
  id: string
  providerId: string
  dayOfWeek: DayOfWeek
  startTime: string // "09:00"
  endTime: string // "17:00"
  isClosed: boolean
}

export interface TimeOff {
  id: string
  providerId: string
  startAt: string
  endAt: string
  reason: string | null
}

export interface Booking {
  id: string
  providerId: string
  serviceId: string
  serviceName?: string
  clientName: string
  clientEmail: string
  clientPhone: string
  scheduledStart: string
  scheduledEnd: string
  status: BookingStatus
  servicePrice: number
  depositAmount: number
  depositPaid: boolean
  notes: string | null
  createdAt: string
}

export interface Payment {
  id: string
  bookingId: string | null
  providerId: string | null
  purpose: PaymentPurpose
  gateway: PaymentGateway
  gatewayReference: string | null
  amount: number
  currency: string
  status: PaymentStatus
  createdAt: string
}

export interface Wallet {
  id: string
  providerId: string
  availableBalance: number
  pendingBalance: number
  currency: string
}

export interface WalletTransaction {
  id: string
  walletId: string
  type: WalletTransactionType
  amount: number
  bookingId: string | null
  payoutId: string | null
  description: string | null
  createdAt: string
}

export interface PayoutDestination {
  bankName?: string
  accountName?: string
  accountNumber?: string
  provider?: string
  mobileNumber?: string
  [key: string]: string | undefined
}

export interface PayoutRequest {
  id: string
  providerId: string
  amount: number
  feeAmount: number
  netAmount: number
  method: PayoutMethod
  destinationJson: string
  status: PayoutStatus
  createdAt: string
  processedAt: string | null
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

// ---- Auth ----

export interface RegisterPayload {
  email: string
  password: string
  businessName: string
  category: ProviderCategory
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: AppUser
}

export interface RefreshPayload {
  refreshToken: string
}

// ---- Public storefront ----

export interface PublicProviderPayload {
  provider: ProviderProfile
  services: Service[]
  workingHours: WorkingHours[]
}

export interface AvailableSlot {
  start: string
  end: string
}

// ---- Bookings ----

export interface CreatePublicBookingPayload {
  slug: string
  serviceId: string
  scheduledStart: string
  clientName: string
  clientEmail: string
  clientPhone: string
  notes?: string
}

export interface PaymentInitPayload {
  bookingId: string
  gateway: PaymentGateway
  amount: number
  currency: string
  // Stripe
  clientSecret?: string
  // Paystack
  accessCode?: string
  reference?: string
  publicKey?: string
}

export interface CreatePublicBookingResponse {
  booking: Booking
  payment: PaymentInitPayload
}

export interface BookingListParams extends PaginationParams {
  status?: BookingStatus
  from?: string
  to?: string
}

// ---- Wallet / payouts ----

export interface CreatePayoutPayload {
  amount: number
  method: PayoutMethod
  destination: PayoutDestination
}

// ---- Subscriptions ----

export interface SubscriptionCheckoutPayload {
  gateway: PaymentGateway
}

export interface SubscriptionCheckoutResponse {
  url?: string
  accessCode?: string
  reference?: string
  publicKey?: string
}
