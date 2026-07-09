using BookingSaas.Domain.Enums;

namespace BookingSaas.Domain.Entities;

/// <summary>Seeded, single plan for v1 (Standard, $5.00/month).</summary>
public class SubscriptionPlan
{
    /// <summary>Well-known id for the seeded "Standard" plan row, so callers never need a lookup
    /// to reference it (e.g. when creating a brand-new ProviderSubscription at signup).</summary>
    public static readonly Guid StandardPlanId = new("22222222-2222-2222-2222-222222222222");

    public Guid Id { get; set; } = StandardPlanId;
    public string Name { get; set; } = "Standard";
    public decimal PriceUsd { get; set; } = 5.00m;
    public SubscriptionInterval Interval { get; set; } = SubscriptionInterval.Monthly;
}
