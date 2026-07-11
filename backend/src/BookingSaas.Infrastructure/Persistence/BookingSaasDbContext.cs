using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BookingSaas.Infrastructure.Persistence;

/// <summary>
/// EF Core write/read model. Inherits IdentityDbContext so ASP.NET Core Identity's UserManager can
/// manage AppUser directly (password hashing, user store) - AppUser IS the Identity user, see
/// Domain/Entities/AppUser.cs. Implements IApplicationDbContext, which the Application layer uses
/// as its combined repository + unit-of-work seam (see that interface's doc comment).
/// </summary>
public class BookingSaasDbContext : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>, IApplicationDbContext
{
    public BookingSaasDbContext(DbContextOptions<BookingSaasDbContext> options) : base(options) { }

    public DbSet<ProviderProfile> ProviderProfiles => Set<ProviderProfile>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<ProviderSubscription> ProviderSubscriptions => Set<ProviderSubscription>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<WorkingHours> WorkingHours => Set<WorkingHours>();
    public DbSet<TimeOff> TimeOffs => Set<TimeOff>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<PayoutRequest> PayoutRequests => Set<PayoutRequest>();
    public DbSet<PlatformSettings> PlatformSettings => Set<PlatformSettings>();

    // Users, UserRoles, UserClaims, etc. are already exposed by IdentityDbContext<AppUser, ...>.

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(BookingSaasDbContext).Assembly);

        // Identity's default table names (AspNetUsers, AspNetRoles, ...) are kept as-is for
        // familiarity; only our own tables get explicit names via IEntityTypeConfiguration<T>.
    }
}
