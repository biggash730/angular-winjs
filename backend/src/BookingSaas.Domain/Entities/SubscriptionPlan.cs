using BookingSaas.Domain.Enums;

namespace BookingSaas.Domain.Entities;

/// <summary>Seeded, single plan for v1 (Standard, $5.00/month).</summary>
public class SubscriptionPlan
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "Standard";
    public decimal PriceUsd { get; set; } = 5.00m;
    public SubscriptionInterval Interval { get; set; } = SubscriptionInterval.Monthly;
}
