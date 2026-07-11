using BookingSaas.Domain.Enums;

namespace BookingSaas.Application.Admin;

public record AdminDashboardStatsDto(
    int TotalProviders,
    int ActiveProviders,
    int TotalBookings,
    int BookingsThisMonth,
    decimal TotalDepositsCollected,
    decimal TotalPlatformPayoutFees,
    int PendingPayouts,
    int ActiveSubscriptions,
    decimal MonthlyRecurringRevenueUsd);

public record AdminProviderDto(
    Guid Id,
    string BusinessName,
    string Slug,
    string Email,
    ProviderCategory Category,
    bool IsActive,
    SubscriptionStatus? SubscriptionStatus,
    DateTime CreatedAt);

public record AdminProviderDetailDto(
    Guid Id,
    string BusinessName,
    string Slug,
    string Email,
    ProviderCategory Category,
    bool IsActive,
    SubscriptionStatus? SubscriptionStatus,
    DateTime? CurrentPeriodEnd,
    decimal AvailableBalance,
    decimal PendingBalance,
    int TotalBookings,
    DateTime CreatedAt);

public record AdminPaymentDto(
    Guid Id,
    Guid? BookingId,
    Guid? ProviderId,
    PaymentPurpose Purpose,
    PaymentGatewayType Gateway,
    string? GatewayReference,
    decimal Amount,
    string Currency,
    PaymentStatus Status,
    DateTime CreatedAt);

public record AdminPayoutDto(
    Guid Id,
    Guid ProviderId,
    string ProviderBusinessName,
    decimal Amount,
    decimal FeeAmount,
    decimal NetAmount,
    PayoutMethod Method,
    PayoutStatus Status,
    DateTime CreatedAt,
    DateTime? ProcessedAt);

public record AdminSubscriptionDto(
    Guid Id,
    Guid ProviderId,
    string ProviderBusinessName,
    PaymentGatewayType Gateway,
    SubscriptionStatus Status,
    DateTime CurrentPeriodEnd);

public record PlatformSettingsDto(decimal SubscriptionPriceUsd, decimal PayoutFeePercentage, decimal PayoutFeeFixedUsd);

public record UpdatePlatformSettingsRequest(decimal SubscriptionPriceUsd, decimal PayoutFeePercentage, decimal PayoutFeeFixedUsd);
