using BookingSaas.Domain.Enums;

namespace BookingSaas.Domain.Entities;

public class ProviderSubscription
{
    public Guid Id { get; set; }

    public Guid ProviderId { get; set; }
    public ProviderProfile? Provider { get; set; }

    public Guid PlanId { get; set; }
    public SubscriptionPlan? Plan { get; set; }

    public PaymentGatewayType Gateway { get; set; }
    public string? GatewaySubscriptionId { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Trialing;
    public DateTime CurrentPeriodEnd { get; set; }
}
