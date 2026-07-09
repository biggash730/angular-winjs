using BookingSaas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BookingSaas.Infrastructure.Persistence.Configurations;

public class PlatformSettingsConfiguration : IEntityTypeConfiguration<PlatformSettings>
{
    public void Configure(EntityTypeBuilder<PlatformSettings> builder)
    {
        builder.ToTable("PlatformSettings");

        builder.Property(s => s.SubscriptionPriceUsd).HasColumnType("decimal(18,2)");
        builder.Property(s => s.PayoutFeePercentage).HasColumnType("decimal(5,2)");
        builder.Property(s => s.PayoutFeeFixedUsd).HasColumnType("decimal(18,2)");

        builder.HasData(new PlatformSettings
        {
            Id = PlatformSettings.SingletonId,
            SubscriptionPriceUsd = 5.00m,
            PayoutFeePercentage = 2.0m,
            PayoutFeeFixedUsd = 0.30m
        });
    }
}

public class SubscriptionPlanSeedConfiguration : IEntityTypeConfiguration<SubscriptionPlan>
{
    public void Configure(EntityTypeBuilder<SubscriptionPlan> builder)
    {
        builder.HasData(new SubscriptionPlan
        {
            Id = SubscriptionPlan.StandardPlanId,
            Name = "Standard",
            PriceUsd = 5.00m,
            Interval = Domain.Enums.SubscriptionInterval.Monthly
        });
    }
}
