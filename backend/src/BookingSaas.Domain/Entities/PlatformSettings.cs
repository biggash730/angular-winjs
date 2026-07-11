namespace BookingSaas.Domain.Entities;

/// <summary>Singleton row (Id is always the same well-known GUID).</summary>
public class PlatformSettings
{
    public static readonly Guid SingletonId = new("11111111-1111-1111-1111-111111111111");

    public Guid Id { get; set; } = SingletonId;

    public decimal SubscriptionPriceUsd { get; set; } = 5.00m;
    public decimal PayoutFeePercentage { get; set; } = 2.0m;
    public decimal PayoutFeeFixedUsd { get; set; } = 0.30m;
}
