using BookingSaas.Application.Common.Exceptions;
using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Domain.Entities;
using BookingSaas.Domain.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;

namespace BookingSaas.Infrastructure.Payments.Stripe;

/// <summary>
/// Stripe implementation of IPaymentGateway. Deposits use a PaymentIntent with
/// automatic_payment_methods enabled, so card, Apple Pay and Google Pay all flow through the
/// same client secret on the frontend's Payment Element / Payment Request Button. The $5/mo
/// subscription uses a Checkout Session (mode=subscription) against the price configured in
/// Stripe__SubscriptionPriceId.
/// </summary>
public class StripeGateway : IPaymentGateway
{
    private readonly StripeSettings _settings;
    private readonly FrontendSettings _frontend;
    private readonly ILogger<StripeGateway> _logger;
    private readonly StripeClient _client;

    public PaymentGatewayType GatewayType => PaymentGatewayType.Stripe;

    public StripeGateway(IOptions<StripeSettings> settings, IOptions<FrontendSettings> frontend, ILogger<StripeGateway> logger)
    {
        _settings = settings.Value;
        _frontend = frontend.Value;
        _logger = logger;
        _client = new StripeClient(_settings.SecretKey);
    }

    public async Task<DepositInitResult> InitiateDepositAsync(Booking booking, decimal amount, string currency, CancellationToken ct = default)
    {
        var service = new PaymentIntentService(_client);
        var intent = await service.CreateAsync(new PaymentIntentCreateOptions
        {
            Amount = ToMinorUnits(amount),
            Currency = currency,
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions { Enabled = true },
            Metadata = new Dictionary<string, string>
            {
                ["bookingId"] = booking.Id.ToString(),
                ["providerId"] = booking.ProviderId.ToString()
            }
        }, cancellationToken: ct);

        return new DepositInitResult(intent.Id, StripeClientSecret: intent.ClientSecret, StripePublishableKey: _settings.PublishableKey);
    }

    public async Task<SubscriptionCheckoutResult> InitiateSubscriptionCheckoutAsync(ProviderProfile provider, ProviderSubscription subscription, CancellationToken ct = default)
    {
        var service = new SessionService(_client);
        var session = await service.CreateAsync(new SessionCreateOptions
        {
            Mode = "subscription",
            LineItems = new List<SessionLineItemOptions>
            {
                new() { Price = _settings.SubscriptionPriceId, Quantity = 1 }
            },
            ClientReferenceId = provider.Id.ToString(),
            SuccessUrl = $"{_frontend.WebAppUrl.TrimEnd('/')}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
            CancelUrl = $"{_frontend.WebAppUrl.TrimEnd('/')}/subscription/cancel",
            Metadata = new Dictionary<string, string> { ["providerId"] = provider.Id.ToString() },
            SubscriptionData = new SessionSubscriptionDataOptions
            {
                Metadata = new Dictionary<string, string> { ["providerId"] = provider.Id.ToString() }
            }
        }, cancellationToken: ct);

        return new SubscriptionCheckoutResult(session.Id, StripeCheckoutUrl: session.Url);
    }

    public async Task<RefundResult> RefundAsync(Payment payment, CancellationToken ct = default)
    {
        try
        {
            var service = new RefundService(_client);
            var refund = await service.CreateAsync(new RefundCreateOptions
            {
                PaymentIntent = payment.GatewayReference
            }, cancellationToken: ct);

            var success = refund.Status is "succeeded" or "pending";
            return new RefundResult(success, refund.Id, success ? null : refund.FailureReason);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe refund failed for payment {PaymentId}", payment.Id);
            return new RefundResult(false, null, ex.Message);
        }
    }

    public Task<WebhookEvent> ParseWebhookAsync(string rawBody, IReadOnlyDictionary<string, string> headers, CancellationToken ct = default)
    {
        if (!TryGetHeader(headers, "Stripe-Signature", out var signature))
            throw new BadRequestException("Missing Stripe-Signature header.");

        // throwOnApiVersionMismatch:false keeps this resilient if the Stripe API version pinned
        // on the account drifts from the one this Stripe.net version was built against.
        var stripeEvent = EventUtility.ConstructEvent(rawBody, signature, _settings.WebhookSecret, throwOnApiVersionMismatch: false);

        WebhookEvent result = stripeEvent.Type switch
        {
            "payment_intent.succeeded" when stripeEvent.Data.Object is PaymentIntent pi =>
                new WebhookEvent(WebhookEventType.DepositSucceeded, pi.Id, ParseGuid(pi.Metadata, "bookingId"), ParseGuid(pi.Metadata, "providerId")),

            "payment_intent.payment_failed" when stripeEvent.Data.Object is PaymentIntent pi =>
                new WebhookEvent(WebhookEventType.DepositFailed, pi.Id, ParseGuid(pi.Metadata, "bookingId"), ParseGuid(pi.Metadata, "providerId")),

            "checkout.session.completed" when stripeEvent.Data.Object is Session session && session.Mode == "subscription" =>
                new WebhookEvent(WebhookEventType.SubscriptionActivated, session.SubscriptionId ?? session.Id, null, ParseGuid(session.Metadata, "providerId")),

            "customer.subscription.updated" when stripeEvent.Data.Object is Subscription sub =>
                new WebhookEvent(MapSubscriptionStatus(sub.Status), sub.Id, null, ParseGuid(sub.Metadata, "providerId")),

            "customer.subscription.deleted" when stripeEvent.Data.Object is Subscription sub =>
                new WebhookEvent(WebhookEventType.SubscriptionCanceled, sub.Id, null, ParseGuid(sub.Metadata, "providerId")),

            _ => new WebhookEvent(WebhookEventType.Unknown, stripeEvent.Id, null, null)
        };

        return Task.FromResult(result);
    }

    private static WebhookEventType MapSubscriptionStatus(string status) => status switch
    {
        "active" or "trialing" => WebhookEventType.SubscriptionActivated,
        "past_due" or "unpaid" or "incomplete" => WebhookEventType.SubscriptionPastDue,
        "canceled" => WebhookEventType.SubscriptionCanceled,
        _ => WebhookEventType.Unknown
    };

    private static long ToMinorUnits(decimal amount) => (long)Math.Round(amount * 100m, 0, MidpointRounding.AwayFromZero);

    private static Guid? ParseGuid(IDictionary<string, string>? metadata, string key) =>
        metadata is not null && metadata.TryGetValue(key, out var value) && Guid.TryParse(value, out var guid) ? guid : null;

    private static bool TryGetHeader(IReadOnlyDictionary<string, string> headers, string name, out string value)
    {
        foreach (var kvp in headers)
        {
            if (string.Equals(kvp.Key, name, StringComparison.OrdinalIgnoreCase))
            {
                value = kvp.Value;
                return true;
            }
        }
        value = string.Empty;
        return false;
    }
}
