namespace BookingSaas.Infrastructure.Payments;

/// <summary>Bound from the Stripe__* env vars / Stripe section.</summary>
public class StripeSettings
{
    public const string SectionName = "Stripe";

    public string SecretKey { get; set; } = default!;
    public string WebhookSecret { get; set; } = default!;
    public string PublishableKey { get; set; } = default!;
    public string SubscriptionPriceId { get; set; } = default!;
}

/// <summary>Bound from the Paystack__* env vars / Paystack section.</summary>
public class PaystackSettings
{
    public const string SectionName = "Paystack";

    public string SecretKey { get; set; } = default!;
    public string PublicKey { get; set; } = default!;
    public string BaseUrl { get; set; } = "https://api.paystack.co";
}

/// <summary>Bound from the Frontend__* env vars - used for Stripe Checkout success/cancel
/// redirects, Paystack callback URLs, and (in the API layer) CORS.</summary>
public class FrontendSettings
{
    public const string SectionName = "Frontend";

    public string WebAppUrl { get; set; } = default!;
    public string AdminAppUrl { get; set; } = default!;
}
