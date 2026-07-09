using BookingSaas.Domain.Enums;

namespace BookingSaas.Domain.Entities;

public class Payment
{
    public Guid Id { get; set; }

    public Guid? BookingId { get; set; }
    public Booking? Booking { get; set; }

    public Guid? ProviderId { get; set; }
    public ProviderProfile? Provider { get; set; }

    public PaymentPurpose Purpose { get; set; }
    public PaymentGatewayType Gateway { get; set; }

    /// <summary>Gateway-side identifier: PaymentIntent id, Checkout Session id, Paystack reference, etc.</summary>
    public string? GatewayReference { get; set; }

    public decimal Amount { get; set; }
    public string Currency { get; set; } = "usd";
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
