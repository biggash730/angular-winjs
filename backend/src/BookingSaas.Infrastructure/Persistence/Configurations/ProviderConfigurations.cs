using BookingSaas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BookingSaas.Infrastructure.Persistence.Configurations;

public class ProviderProfileConfiguration : IEntityTypeConfiguration<ProviderProfile>
{
    public void Configure(EntityTypeBuilder<ProviderProfile> builder)
    {
        builder.ToTable("ProviderProfiles");

        builder.Property(p => p.BusinessName).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Slug).HasMaxLength(220).IsRequired();
        builder.Property(p => p.Category).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(p => p.Bio).HasMaxLength(2000);
        builder.Property(p => p.LogoUrl).HasMaxLength(1000);
        builder.Property(p => p.CoverImageUrl).HasMaxLength(1000);
        builder.Property(p => p.BrandColor).HasMaxLength(20);
        builder.Property(p => p.Address).HasMaxLength(500);
        builder.Property(p => p.Phone).HasMaxLength(30);
        builder.Property(p => p.Timezone).HasMaxLength(100).IsRequired();

        builder.HasIndex(p => p.Slug).IsUnique();
        builder.HasIndex(p => p.UserId).IsUnique();

        builder.HasOne(p => p.Wallet)
            .WithOne(w => w.Provider)
            .HasForeignKey<Wallet>(w => w.ProviderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Subscription)
            .WithOne(s => s.Provider)
            .HasForeignKey<ProviderSubscription>(s => s.ProviderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Services)
            .WithOne(s => s.Provider)
            .HasForeignKey(s => s.ProviderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.WorkingHours)
            .WithOne(w => w.Provider)
            .HasForeignKey(w => w.ProviderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.TimeOffs)
            .WithOne(t => t.Provider)
            .HasForeignKey(t => t.ProviderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Bookings)
            .WithOne(b => b.Provider)
            .HasForeignKey(b => b.ProviderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ServiceConfiguration : IEntityTypeConfiguration<Service>
{
    public void Configure(EntityTypeBuilder<Service> builder)
    {
        builder.ToTable("Services");

        builder.Property(s => s.Name).HasMaxLength(200).IsRequired();
        builder.Property(s => s.Description).HasMaxLength(2000);
        builder.Property(s => s.Price).HasColumnType("decimal(18,2)");

        builder.HasIndex(s => s.ProviderId);
    }
}

public class WorkingHoursConfiguration : IEntityTypeConfiguration<WorkingHours>
{
    public void Configure(EntityTypeBuilder<WorkingHours> builder)
    {
        builder.ToTable("WorkingHours");
        builder.HasIndex(w => new { w.ProviderId, w.DayOfWeek });
    }
}

public class TimeOffConfiguration : IEntityTypeConfiguration<TimeOff>
{
    public void Configure(EntityTypeBuilder<TimeOff> builder)
    {
        builder.ToTable("TimeOffs");
        builder.Property(t => t.Reason).HasMaxLength(500);
        builder.HasIndex(t => t.ProviderId);
    }
}

public class SubscriptionPlanConfiguration : IEntityTypeConfiguration<SubscriptionPlan>
{
    public void Configure(EntityTypeBuilder<SubscriptionPlan> builder)
    {
        builder.ToTable("SubscriptionPlans");
        builder.Property(p => p.Name).HasMaxLength(100).IsRequired();
        builder.Property(p => p.PriceUsd).HasColumnType("decimal(18,2)");
        builder.Property(p => p.Interval).HasConversion<string>().HasMaxLength(20);
    }
}

public class ProviderSubscriptionConfiguration : IEntityTypeConfiguration<ProviderSubscription>
{
    public void Configure(EntityTypeBuilder<ProviderSubscription> builder)
    {
        builder.ToTable("ProviderSubscriptions");

        builder.Property(s => s.Gateway).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(s => s.GatewaySubscriptionId).HasMaxLength(200);
        builder.Property(s => s.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(s => s.ProviderId).IsUnique();

        builder.HasOne(s => s.Plan)
            .WithMany()
            .HasForeignKey(s => s.PlanId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
