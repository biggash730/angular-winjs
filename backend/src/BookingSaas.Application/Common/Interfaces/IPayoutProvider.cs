using BookingSaas.Domain.Entities;

namespace BookingSaas.Application.Common.Interfaces;

public record PayoutDispatchResult(bool Success, string? ProviderReference, string? FailureReason = null);

/// <summary>
/// Stub for the real bank-transfer / mobile-money disbursement rail. In v1, payouts are queued
/// Pending and settled by an admin action (Processing -> Completed); this interface exists so a
/// real disbursement API (Stripe Connect payouts, Paystack transfers, etc.) can be dropped in
/// later without touching WalletService/AdminService.
/// </summary>
public interface IPayoutProvider
{
    Task<PayoutDispatchResult> DispatchAsync(PayoutRequest payout, CancellationToken ct = default);
}
