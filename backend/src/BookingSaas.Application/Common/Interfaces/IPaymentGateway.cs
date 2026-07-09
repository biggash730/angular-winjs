using BookingSaas.Domain.Entities;
using BookingSaas.Domain.Enums;

namespace BookingSaas.Application.Common.Interfaces;

/// <summary>Result of starting a deposit payment. Exactly one of the gateway-specific payloads is set.</summary>
public record DepositInitResult(
    string GatewayReference,
    string? StripeClientSecret = null,
    string? StripePublishableKey = null,
    string? PaystackAccessCode = null,
    string? PaystackPublicKey = null,
    string? PaystackReference = null);

/// <summary>Result of starting the $5/mo subscription checkout.</summary>
public record SubscriptionCheckoutResult(
    string GatewayReference,
    string? StripeCheckoutUrl = null,
    string? PaystackAuthorizationUrl = null,
    string? PaystackAccessCode = null,
    string? PaystackReference = null);

public record RefundResult(bool Success, string? GatewayReference, string? FailureReason = null);

public enum WebhookEventType
{
    Unknown,
    DepositSucceeded,
    DepositFailed,
    SubscriptionActivated,
    SubscriptionPastDue,
    SubscriptionCanceled
}

/// <summary>Normalized webhook payload, identical shape regardless of which gateway sent it, so
/// PaymentsService can process Stripe and Paystack events with one code path.</summary>
public record WebhookEvent(
    WebhookEventType Type,
    string GatewayReference,
    Guid? BookingId,
    Guid? ProviderId);

/// <summary>
/// Abstraction over Stripe / Paystack. The client (public booking page) picks a gateway at
/// checkout time; the rest of the app never branches on gateway type outside this interface.
/// </summary>
public interface IPaymentGateway
{
    PaymentGatewayType GatewayType { get; }

    Task<DepositInitResult> InitiateDepositAsync(Booking booking, decimal amount, string currency, CancellationToken ct = default);

    Task<SubscriptionCheckoutResult> InitiateSubscriptionCheckoutAsync(ProviderProfile provider, ProviderSubscription subscription, CancellationToken ct = default);

    Task<RefundResult> RefundAsync(Payment payment, CancellationToken ct = default);

    /// <summary>Verifies signature and parses a raw webhook body into a normalized event.</summary>
    Task<WebhookEvent> ParseWebhookAsync(string rawBody, IReadOnlyDictionary<string, string> headers, CancellationToken ct = default);
}
