namespace BookingSaas.Domain.Entities;

public class WorkingHours
{
    public Guid Id { get; set; }

    public Guid ProviderId { get; set; }
    public ProviderProfile? Provider { get; set; }

    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsClosed { get; set; }
}
