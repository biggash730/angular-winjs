using BookingSaas.Application.Common.Exceptions;
using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Domain.Entities;
using BookingSaas.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BookingSaas.Application.Payments;

/// <summary>Processes Stripe/Paystack webhooks behind a single normalized code path (see
/// IPaymentGateway.ParseWebhookAsync). Handles deposit settlement (crediting Wallet.PendingBalance)
/// and subscription lifecycle transitions.</summary>
public class PaymentsService
{
    private readonly IApplicationDbContext _db;
    private readonly IEnumerable<IPaymentGateway> _gateways;
    private readonly ILogger<PaymentsService> _logger;

    public PaymentsService(IApplicationDbContext db, IEnumerable<IPaymentGateway> gateways, ILogger<PaymentsService> logger)
    {
        _db = db;
        _gateways = gateways;
        _logger = logger;
    }

    public async Task HandleWebhookAsync(PaymentGatewayType gatewayType, string rawBody, IReadOnlyDictionary<string, string> headers, CancellationToken ct = default)
    {
        var gateway = _gateways.FirstOrDefault(g => g.GatewayType == gatewayType)
            ?? throw new BadRequestException($"Payment gateway '{gatewayType}' is not configured.");

        var evt = await gateway.ParseWebhookAsync(rawBody, headers, ct);

        switch (evt.Type)
        {
            case WebhookEventType.DepositSucceeded:
                await HandleDepositSucceededAsync(evt, ct);
                break;
            case WebhookEventType.DepositFailed:
                await HandleDepositFailedAsync(evt, ct);
                break;
            case WebhookEventType.SubscriptionActivated:
                await HandleSubscriptionStatusAsync(evt, SubscriptionStatus.Active, ct);
                break;
            case WebhookEventType.SubscriptionPastDue:
                await HandleSubscriptionStatusAsync(evt, SubscriptionStatus.PastDue, ct);
                break;
            case WebhookEventType.SubscriptionCanceled:
                await HandleSubscriptionStatusAsync(evt, SubscriptionStatus.Canceled, ct);
                break;
            default:
                _logger.LogInformation("Ignoring unrecognized {Gateway} webhook event for reference {Reference}", gatewayType, evt.GatewayReference);
                break;
        }
    }

    private async Task HandleDepositSucceededAsync(WebhookEvent evt, CancellationToken ct)
    {
        var payment = await _db.Payments.FirstOrDefaultAsync(p => p.GatewayReference == evt.GatewayReference, ct);
        if (payment is null || payment.Status == PaymentStatus.Succeeded) return;

        payment.Status = PaymentStatus.Succeeded;

        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == payment.BookingId, ct);
        if (booking is null) return;

        booking.DepositPaid = true;
        if (booking.Status == BookingStatus.PendingPayment)
            booking.Status = BookingStatus.Confirmed;

        var wallet = await _db.Wallets.FirstOrDefaultAsync(w => w.ProviderId == booking.ProviderId, ct);
        if (wallet is not null)
        {
            wallet.PendingBalance += payment.Amount;
            _db.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                Type = WalletTransactionType.DepositHeld,
                Amount = payment.Amount,
                BookingId = booking.Id,
                Description = "Deposit held pending appointment completion",
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync(ct);
    }

    private async Task HandleDepositFailedAsync(WebhookEvent evt, CancellationToken ct)
    {
        var payment = await _db.Payments.FirstOrDefaultAsync(p => p.GatewayReference == evt.GatewayReference, ct);
        if (payment is null) return;

        payment.Status = PaymentStatus.Failed;

        // Free up the slot: a booking whose deposit failed never got confirmed.
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == payment.BookingId, ct);
        if (booking is not null && booking.Status == BookingStatus.PendingPayment)
            booking.Status = BookingStatus.Cancelled;

        await _db.SaveChangesAsync(ct);
    }

    private async Task HandleSubscriptionStatusAsync(WebhookEvent evt, SubscriptionStatus status, CancellationToken ct)
    {
        var subscription = await _db.ProviderSubscriptions
            .FirstOrDefaultAsync(s => s.GatewaySubscriptionId == evt.GatewayReference || s.ProviderId == evt.ProviderId, ct);
        if (subscription is null) return;

        subscription.Status = status;
        if (status == SubscriptionStatus.Active)
            subscription.CurrentPeriodEnd = DateTime.UtcNow.AddMonths(1);
        if (string.IsNullOrEmpty(subscription.GatewaySubscriptionId))
            subscription.GatewaySubscriptionId = evt.GatewayReference;

        await _db.SaveChangesAsync(ct);
    }
}
