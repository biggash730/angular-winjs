using BookingSaas.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BookingSaas.Application.Common.Interfaces;

/// <summary>
/// Persistence seam for the Application layer. EF Core's <see cref="DbSet{T}"/> already gives us
/// query (IQueryable), add and remove behaviour, so this interface doubles as the
/// repository + unit-of-work abstraction for the whole solution instead of a hand-rolled
/// repository per aggregate - see backend/README.md "Design notes". Implemented by
/// BookingSaas.Infrastructure.Persistence.BookingSaasDbContext.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<AppUser> Users { get; }
    DbSet<ProviderProfile> ProviderProfiles { get; }
    DbSet<SubscriptionPlan> SubscriptionPlans { get; }
    DbSet<ProviderSubscription> ProviderSubscriptions { get; }
    DbSet<Service> Services { get; }
    DbSet<WorkingHours> WorkingHours { get; }
    DbSet<TimeOff> TimeOffs { get; }
    DbSet<Booking> Bookings { get; }
    DbSet<Payment> Payments { get; }
    DbSet<Wallet> Wallets { get; }
    DbSet<WalletTransaction> WalletTransactions { get; }
    DbSet<PayoutRequest> PayoutRequests { get; }
    DbSet<PlatformSettings> PlatformSettings { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
