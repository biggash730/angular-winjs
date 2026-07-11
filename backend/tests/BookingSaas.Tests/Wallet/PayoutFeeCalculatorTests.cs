using BookingSaas.Application.Wallet;
using Xunit;

namespace BookingSaas.Tests.Wallet;

public class PayoutFeeCalculatorTests
{
    [Fact]
    public void Calculate_AppliesDefaultTwoPercentPlusThirtyCents()
    {
        var result = PayoutFeeCalculator.Calculate(100m, feePercentage: 2.0m, feeFixedUsd: 0.30m);

        Assert.Equal(2.30m, result.FeeAmount);
        Assert.Equal(97.70m, result.NetAmount);
    }

    [Theory]
    [InlineData(10, 2.0, 0.30, 0.50, 9.50)]
    [InlineData(1000, 2.0, 0.30, 20.30, 979.70)]
    [InlineData(5, 2.0, 0.30, 0.40, 4.60)]
    public void Calculate_MatchesExpectedBreakdown(decimal amount, decimal feePercentage, decimal feeFixed, decimal expectedFee, decimal expectedNet)
    {
        var result = PayoutFeeCalculator.Calculate(amount, feePercentage, feeFixed);

        Assert.Equal(expectedFee, result.FeeAmount);
        Assert.Equal(expectedNet, result.NetAmount);
    }

    [Fact]
    public void Calculate_NeverLetsFeeExceedTheRequestedAmount()
    {
        // A tiny payout where the fixed fee alone would exceed the amount must be clamped.
        var result = PayoutFeeCalculator.Calculate(0.10m, feePercentage: 2.0m, feeFixedUsd: 0.30m);

        Assert.Equal(0.10m, result.FeeAmount);
        Assert.Equal(0.00m, result.NetAmount);
    }

    [Fact]
    public void Calculate_ThrowsForNonPositiveAmount()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => PayoutFeeCalculator.Calculate(0m, 2.0m, 0.30m));
        Assert.Throws<ArgumentOutOfRangeException>(() => PayoutFeeCalculator.Calculate(-5m, 2.0m, 0.30m));
    }
}
