using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace BookingSaas.Infrastructure.Payments;

/// <summary>
/// v1 payout disbursement stub: real settlement happens outside the app (ops manually wires the
/// bank transfer / mobile money payout after an admin approves the request in-app), so this
/// always reports success and logs what would have been dispatched. Swap for a real
/// Stripe Connect / Paystack Transfers implementation later without touching AdminService.
/// </summary>
public class StubPayoutProvider : IPayoutProvider
{
    private readonly ILogger<StubPayoutProvider> _logger;

    public StubPayoutProvider(ILogger<StubPayoutProvider> logger)
    {
        _logger = logger;
    }

    public Task<PayoutDispatchResult> DispatchAsync(PayoutRequest payout, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "STUB payout dispatch: PayoutRequest {PayoutId} for provider {ProviderId}, net amount {NetAmount} via {Method}. " +
            "No real transfer was made - wire this up to Stripe Connect payouts or Paystack Transfers when going live.",
            payout.Id, payout.ProviderId, payout.NetAmount, payout.Method);

        return Task.FromResult(new PayoutDispatchResult(true, $"stub_{payout.Id}"));
    }
}
