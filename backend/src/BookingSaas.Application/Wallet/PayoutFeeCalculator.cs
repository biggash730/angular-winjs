namespace BookingSaas.Application.Wallet;

public readonly record struct PayoutFeeBreakdown(decimal FeeAmount, decimal NetAmount);

/// <summary>Pure function so the payout fee math (PlatformSettings.PayoutFeePercentage +
/// PayoutFeeFixedUsd, default 2% + $0.30) can be unit tested without any infrastructure.</summary>
public static class PayoutFeeCalculator
{
    public static PayoutFeeBreakdown Calculate(decimal amount, decimal feePercentage, decimal feeFixedUsd)
    {
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount), "Amount must be positive.");

        var fee = Math.Round(amount * (feePercentage / 100m) + feeFixedUsd, 2, MidpointRounding.AwayFromZero);
        if (fee > amount) fee = amount;
        var net = Math.Round(amount - fee, 2, MidpointRounding.AwayFromZero);
        return new PayoutFeeBreakdown(fee, net);
    }
}
