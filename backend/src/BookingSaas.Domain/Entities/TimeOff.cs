namespace BookingSaas.Domain.Entities;

public class TimeOff
{
    public Guid Id { get; set; }

    public Guid ProviderId { get; set; }
    public ProviderProfile? Provider { get; set; }

    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public string? Reason { get; set; }
}
