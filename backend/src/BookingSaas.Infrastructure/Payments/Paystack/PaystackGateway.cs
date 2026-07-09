using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using BookingSaas.Application.Common.Exceptions;
using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Domain.Entities;
using BookingSaas.Domain.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BookingSaas.Infrastructure.Payments.Paystack;

/// <summary>
/// Paystack has no official .NET SDK, so this talks to api.paystack.co directly over a typed
/// HttpClient (base address + Bearer secret key configured in DI - see
/// BookingSaas.Infrastructure.DependencyInjection). Deposits use Transaction Initialize/Verify;
/// the $5/mo subscription lazily creates (or reuses) a Paystack Plan and initializes a
/// plan-linked transaction, which Paystack auto-converts into a running subscription after the
/// first successful charge.
/// </summary>
public class PaystackGateway : IPaymentGateway
{
    private const string SubscriptionPlanName = "BookMe Standard Monthly";

    private readonly HttpClient _http;
    private readonly PaystackSettings _settings;
    private readonly FrontendSettings _frontend;
    private readonly ILogger<PaystackGateway> _logger;

    private static string? _cachedPlanCode;
    private static readonly SemaphoreSlim PlanLock = new(1, 1);

    public PaymentGatewayType GatewayType => PaymentGatewayType.Paystack;

    public PaystackGateway(HttpClient http, IOptions<PaystackSettings> settings, IOptions<FrontendSettings> frontend, ILogger<PaystackGateway> logger)
    {
        _http = http;
        _settings = settings.Value;
        _frontend = frontend.Value;
        _logger = logger;
    }

    public async Task<DepositInitResult> InitiateDepositAsync(Booking booking, decimal amount, string currency, CancellationToken ct = default)
    {
        var payload = new Dictionary<string, object?>
        {
            ["email"] = booking.ClientEmail,
            ["amount"] = ToMinorUnits(amount),
            ["currency"] = currency.ToUpperInvariant(),
            ["callback_url"] = $"{_frontend.WebAppUrl.TrimEnd('/')}/book/{booking.ProviderId}/status/{booking.Id}",
            ["metadata"] = new Dictionary<string, object?>
            {
                ["purpose"] = "deposit",
                ["bookingId"] = booking.Id.ToString(),
                ["providerId"] = booking.ProviderId.ToString()
            }
        };

        var data = await PostAsync<PaystackInitializeData>("/transaction/initialize", payload, ct);
        return new DepositInitResult(data.Reference, PaystackAccessCode: data.AccessCode, PaystackPublicKey: _settings.PublicKey, PaystackReference: data.Reference);
    }

    public async Task<SubscriptionCheckoutResult> InitiateSubscriptionCheckoutAsync(ProviderProfile provider, ProviderSubscription subscription, CancellationToken ct = default)
    {
        var planCode = await GetOrCreatePlanCodeAsync(ct);

        var user = provider.User;
        var payload = new Dictionary<string, object?>
        {
            ["email"] = user?.Email ?? $"provider-{provider.Id}@bookme.invalid",
            ["amount"] = ToMinorUnits(5.00m),
            ["plan"] = planCode,
            ["callback_url"] = $"{_frontend.WebAppUrl.TrimEnd('/')}/subscription/success",
            ["metadata"] = new Dictionary<string, object?>
            {
                ["purpose"] = "subscription",
                ["providerId"] = provider.Id.ToString()
            }
        };

        var data = await PostAsync<PaystackInitializeData>("/transaction/initialize", payload, ct);
        return new SubscriptionCheckoutResult(data.Reference, PaystackAuthorizationUrl: data.AuthorizationUrl, PaystackAccessCode: data.AccessCode, PaystackReference: data.Reference);
    }

    public async Task<RefundResult> RefundAsync(Payment payment, CancellationToken ct = default)
    {
        try
        {
            var payload = new Dictionary<string, object?> { ["transaction"] = payment.GatewayReference };
            var response = await _http.PostAsJsonAsync("/refund", payload, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Paystack refund failed for payment {PaymentId}: {Body}", payment.Id, body);
                return new RefundResult(false, null, body);
            }

            return new RefundResult(true, payment.GatewayReference);
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException)
        {
            _logger.LogError(ex, "Paystack refund failed for payment {PaymentId}", payment.Id);
            return new RefundResult(false, null, ex.Message);
        }
    }

    public Task<WebhookEvent> ParseWebhookAsync(string rawBody, IReadOnlyDictionary<string, string> headers, CancellationToken ct = default)
    {
        if (!TryGetHeader(headers, "x-paystack-signature", out var signature) || !VerifySignature(rawBody, signature))
            throw new BadRequestException("Invalid Paystack webhook signature.");

        var payload = JsonSerializer.Deserialize<PaystackWebhookPayload>(rawBody, JsonOptions)
            ?? throw new BadRequestException("Malformed Paystack webhook payload.");

        var purpose = GetMetadataString(payload.Data.Metadata, "purpose");
        var providerId = ParseGuid(GetMetadataString(payload.Data.Metadata, "providerId"));
        var bookingId = ParseGuid(GetMetadataString(payload.Data.Metadata, "bookingId"));
        var reference = payload.Data.Reference ?? payload.Data.SubscriptionCode ?? string.Empty;

        WebhookEvent result = payload.Event switch
        {
            "charge.success" when purpose == "deposit" => new WebhookEvent(WebhookEventType.DepositSucceeded, reference, bookingId, providerId),
            "charge.success" when purpose == "subscription" => new WebhookEvent(WebhookEventType.SubscriptionActivated, reference, null, providerId),
            "charge.failed" when purpose == "deposit" => new WebhookEvent(WebhookEventType.DepositFailed, reference, bookingId, providerId),
            "invoice.payment_failed" => new WebhookEvent(WebhookEventType.SubscriptionPastDue, reference, null, providerId),
            "subscription.disable" or "subscription.not_renew" => new WebhookEvent(WebhookEventType.SubscriptionCanceled, reference, null, providerId),
            _ => new WebhookEvent(WebhookEventType.Unknown, reference, null, null)
        };
        return Task.FromResult(result);
    }

    private async Task<string> GetOrCreatePlanCodeAsync(CancellationToken ct)
    {
        if (_cachedPlanCode is not null) return _cachedPlanCode;

        await PlanLock.WaitAsync(ct);
        try
        {
            if (_cachedPlanCode is not null) return _cachedPlanCode;

            var list = await GetAsync<List<PaystackPlanData>>("/plan?perPage=100", ct);
            var existing = list.FirstOrDefault(p => p.Name == SubscriptionPlanName);
            if (existing is not null)
            {
                _cachedPlanCode = existing.PlanCode;
                return _cachedPlanCode;
            }

            var payload = new Dictionary<string, object?>
            {
                ["name"] = SubscriptionPlanName,
                ["amount"] = ToMinorUnits(5.00m),
                ["interval"] = "monthly",
                ["currency"] = "USD"
            };
            var created = await PostAsync<PaystackPlanData>("/plan", payload, ct);
            _cachedPlanCode = created.PlanCode;
            return _cachedPlanCode;
        }
        finally
        {
            PlanLock.Release();
        }
    }

    private bool VerifySignature(string rawBody, string signature)
    {
        var keyBytes = Encoding.UTF8.GetBytes(_settings.SecretKey);
        var bodyBytes = Encoding.UTF8.GetBytes(rawBody);
        var hash = HMACSHA512.HashData(keyBytes, bodyBytes);
        var computed = Convert.ToHexString(hash);
        return string.Equals(computed, signature, StringComparison.OrdinalIgnoreCase);
    }

    private async Task<T> PostAsync<T>(string path, object payload, CancellationToken ct)
    {
        var response = await _http.PostAsJsonAsync(path, payload, ct);
        var body = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
            throw new BadRequestException($"Paystack request to {path} failed: {body}");

        var envelope = JsonSerializer.Deserialize<PaystackEnvelope<T>>(body, JsonOptions)
            ?? throw new BadRequestException($"Paystack returned an empty response for {path}.");
        if (!envelope.Status || envelope.Data is null)
            throw new BadRequestException($"Paystack rejected the request to {path}: {envelope.Message}");

        return envelope.Data;
    }

    private async Task<T> GetAsync<T>(string path, CancellationToken ct)
    {
        var response = await _http.GetAsync(path, ct);
        var body = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
            throw new BadRequestException($"Paystack request to {path} failed: {body}");

        var envelope = JsonSerializer.Deserialize<PaystackEnvelope<T>>(body, JsonOptions)
            ?? throw new BadRequestException($"Paystack returned an empty response for {path}.");

        return envelope.Data ?? default!;
    }

    private static long ToMinorUnits(decimal amount) => (long)Math.Round(amount * 100m, 0, MidpointRounding.AwayFromZero);

    private static string? GetMetadataString(Dictionary<string, object>? metadata, string key)
    {
        if (metadata is null || !metadata.TryGetValue(key, out var value)) return null;
        if (value is JsonElement el) return el.ValueKind == JsonValueKind.String ? el.GetString() : el.ToString();
        return value.ToString();
    }

    private static Guid? ParseGuid(string? value) => value is not null && Guid.TryParse(value, out var g) ? g : null;

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

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
}
