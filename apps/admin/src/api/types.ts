// Shared DTO types mirroring ARCHITECTURE.md's domain model and REST API
// contract. Keep these in lockstep with the backend's Application DTOs.

export type UserRole = "Provider" | "Client" | "Admin" | "SuperAdmin";

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AppUser;
}

export type ProviderCategory =
  | "Barber"
  | "Hairdresser"
  | "MakeupArtist"
  | "Clinic"
  | "Photographer"
  | "CarRental"
  | "Other";

export type SubscriptionStatus =
  | "Trialing"
  | "Active"
  | "PastDue"
  | "Canceled";

export interface ProviderSummary {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  category: ProviderCategory;
  email: string;
  isActive: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  createdAt: string;
  walletAvailableBalance?: number;
}

export interface ProviderDetail extends ProviderSummary {
  bio: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  brandColor: string | null;
  address: string | null;
  phone: string | null;
  timezone: string;
  wallet: {
    availableBalance: number;
    pendingBalance: number;
    currency: string;
  };
  services: ServiceDto[];
  recentBookings: BookingDto[];
  subscription: SubscriptionDto | null;
}

export interface ServiceDto {
  id: string;
  providerId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  depositPercentage: number;
  isActive: boolean;
}

export type BookingStatus =
  | "PendingPayment"
  | "Confirmed"
  | "Cancelled"
  | "Completed"
  | "NoShow";

export interface BookingDto {
  id: string;
  providerId: string;
  providerBusinessName?: string;
  serviceId: string;
  serviceName?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: BookingStatus;
  servicePrice: number;
  depositAmount: number;
  depositPaid: boolean;
  notes: string | null;
  createdAt: string;
}

export type PaymentPurpose = "BookingDeposit" | "Subscription" | "Payout";
export type PaymentGateway = "Stripe" | "Paystack";
export type PaymentStatus = "Pending" | "Succeeded" | "Failed" | "Refunded";

export interface PaymentDto {
  id: string;
  bookingId: string | null;
  providerId: string | null;
  providerBusinessName?: string;
  purpose: PaymentPurpose;
  gateway: PaymentGateway;
  gatewayReference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
}

export type PayoutMethod = "BankTransfer" | "MobileMoney";
export type PayoutStatus = "Pending" | "Processing" | "Completed" | "Failed";

export interface PayoutRequestDto {
  id: string;
  providerId: string;
  providerBusinessName?: string;
  amount: number;
  feeAmount: number;
  netAmount: number;
  method: PayoutMethod;
  destinationJson: string;
  status: PayoutStatus;
  createdAt: string;
  processedAt: string | null;
}

export interface SubscriptionDto {
  id: string;
  providerId: string;
  providerBusinessName?: string;
  gateway: PaymentGateway;
  gatewaySubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  planName?: string;
  priceUsd?: number;
}

export interface PlatformSettingsDto {
  id: string;
  subscriptionPriceUsd: number;
  payoutFeePercentage: number;
  payoutFeeFixedUsd: number;
}

export interface DashboardStatsDto {
  activeProviders: number;
  totalProviders: number;
  mrr: number;
  totalBookings: number;
  grossDepositVolume: number;
  pendingPayouts: number;
  pendingPayoutsAmount?: number;
  bookingsOverTime?: TimeSeriesPoint[];
  providerSignupsOverTime?: TimeSeriesPoint[];
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
