using BookingSaas.Domain.Enums;

namespace BookingSaas.Domain.Entities;

public class Booking
{
    public Guid Id { get; set; }

    public Guid ProviderId { get; set; }
    public ProviderProfile? Provider { get; set; }

    public Guid ServiceId { get; set; }
    public Service? Service { get; set; }

    public string ClientName { get; set; } = default!;
    public string ClientEmail { get; set; } = default!;
    public string? ClientPhone { get; set; }

    public DateTime ScheduledStart { get; set; }
    public DateTime ScheduledEnd { get; set; }

    public BookingStatus Status { get; set; } = BookingStatus.PendingPayment;

    /// <summary>Snapshot of Service.Price at booking time.</summary>
    public decimal ServicePrice { get; set; }

    public decimal DepositAmount { get; set; }
    public bool DepositPaid { get; set; }

    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
