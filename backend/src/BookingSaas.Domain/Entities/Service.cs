namespace BookingSaas.Domain.Entities;

public class Service
{
    public Guid Id { get; set; }

    public Guid ProviderId { get; set; }
    public ProviderProfile? Provider { get; set; }

    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public int DurationMinutes { get; set; }
    public decimal Price { get; set; }

    /// <summary>0-100. Percentage of Price collected as a deposit at booking time.</summary>
    public int DepositPercentage { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
