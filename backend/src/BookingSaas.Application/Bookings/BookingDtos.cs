using BookingSaas.Domain.Enums;

namespace BookingSaas.Application.Bookings;

/// <summary>
/// Gateway is not spelled out in ARCHITECTURE.md's field list for POST /public/bookings, but the
/// response must return a Stripe-shaped or Paystack-shaped payment payload, and "the client picks
/// a gateway at checkout" (per the tech-stack section) - so the client must tell us which one.
/// Added as an optional field (defaults to Stripe when omitted) as the simplest reasonable
/// resolution; the apps/web frontend independently made the same addition. Documented in
/// README "Design notes".
/// </summary>
public record CreatePublicBookingRequest(
    string Slug,
    Guid ServiceId,
    DateTime ScheduledStart,
    string ClientName,
    string ClientEmail,
    string? ClientPhone,
    string? Notes,
    PaymentGatewayType? Gateway);

public record CreatePublicBookingResponse(
    Guid BookingId,
    decimal DepositAmount,
    string Currency,
    PaymentGatewayType Gateway,
    string? StripeClientSecret,
    string? StripePublishableKey,
    string? PaystackAccessCode,
    string? PaystackPublicKey,
    string? PaystackReference);

public record BookingDto(
    Guid Id,
    Guid ProviderId,
    Guid ServiceId,
    string ServiceName,
    string ClientName,
    string ClientEmail,
    string? ClientPhone,
    DateTime ScheduledStart,
    DateTime ScheduledEnd,
    BookingStatus Status,
    decimal ServicePrice,
    decimal DepositAmount,
    bool DepositPaid,
    string? Notes,
    DateTime CreatedAt);

/// <summary>Client-facing status lookup payload - deliberately excludes provider-only fields (no
/// ClientPhone/Notes) since GET /public/bookings/{id} requires no auth.</summary>
public record PublicBookingStatusDto(
    Guid Id,
    BookingStatus Status,
    string ServiceName,
    DateTime ScheduledStart,
    DateTime ScheduledEnd,
    decimal ServicePrice,
    decimal DepositAmount,
    bool DepositPaid);
