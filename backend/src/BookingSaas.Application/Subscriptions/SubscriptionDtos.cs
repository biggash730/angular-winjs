using BookingSaas.Domain.Enums;

namespace BookingSaas.Application.Subscriptions;

public record SubscriptionCheckoutRequest(PaymentGatewayType Gateway);

public record SubscriptionCheckoutResponse(
    PaymentGatewayType Gateway,
    string? StripeCheckoutUrl,
    string? PaystackAuthorizationUrl,
    string? PaystackAccessCode,
    string? PaystackReference);

public record SubscriptionDto(Guid Id, PaymentGatewayType Gateway, SubscriptionStatus Status, DateTime CurrentPeriodEnd, decimal PriceUsd);
