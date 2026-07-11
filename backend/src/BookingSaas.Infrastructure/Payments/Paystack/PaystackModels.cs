using System.Text.Json.Serialization;

namespace BookingSaas.Infrastructure.Payments.Paystack;

/// <summary>Paystack wraps every response as {status, message, data}. There's no official .NET
/// SDK, so these are hand-rolled models for the handful of endpoints this gateway calls.</summary>
public class PaystackEnvelope<T>
{
    [JsonPropertyName("status")]
    public bool Status { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("data")]
    public T? Data { get; set; }
}

public class PaystackInitializeData
{
    [JsonPropertyName("authorization_url")]
    public string AuthorizationUrl { get; set; } = default!;

    [JsonPropertyName("access_code")]
    public string AccessCode { get; set; } = default!;

    [JsonPropertyName("reference")]
    public string Reference { get; set; } = default!;
}

public class PaystackVerifyData
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = default!;

    [JsonPropertyName("reference")]
    public string Reference { get; set; } = default!;

    [JsonPropertyName("amount")]
    public long Amount { get; set; }

    [JsonPropertyName("metadata")]
    public Dictionary<string, object>? Metadata { get; set; }
}

public class PaystackPlanData
{
    [JsonPropertyName("plan_code")]
    public string PlanCode { get; set; } = default!;

    [JsonPropertyName("name")]
    public string Name { get; set; } = default!;
}

public class PaystackRefundData
{
    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("transaction")]
    public object? Transaction { get; set; }
}

public class PaystackWebhookPayload
{
    [JsonPropertyName("event")]
    public string Event { get; set; } = default!;

    [JsonPropertyName("data")]
    public PaystackWebhookData Data { get; set; } = default!;
}

public class PaystackWebhookData
{
    [JsonPropertyName("reference")]
    public string? Reference { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("metadata")]
    public Dictionary<string, object>? Metadata { get; set; }

    [JsonPropertyName("subscription_code")]
    public string? SubscriptionCode { get; set; }
}
