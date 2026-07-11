using BookingSaas.Domain.Enums;

namespace BookingSaas.Domain.Entities;

public class ProviderProfile
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public AppUser? User { get; set; }

    public string BusinessName { get; set; } = default!;

    /// <summary>Unique, kebab-case, derived from BusinessName with numeric suffix on collision.</summary>
    public string Slug { get; set; } = default!;

    public ProviderCategory Category { get; set; }
    public string? Bio { get; set; }
    public string? LogoUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? BrandColor { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string Timezone { get; set; } = "UTC";
    public bool IsActive { get; set; } = true;

    public Wallet? Wallet { get; set; }
    public ICollection<Service> Services { get; set; } = new List<Service>();
    public ICollection<WorkingHours> WorkingHours { get; set; } = new List<WorkingHours>();
    public ICollection<TimeOff> TimeOffs { get; set; } = new List<TimeOff>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ProviderSubscription? Subscription { get; set; }
}
