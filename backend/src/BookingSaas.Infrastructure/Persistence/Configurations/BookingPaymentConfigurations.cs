using BookingSaas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BookingSaas.Infrastructure.Persistence.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.ToTable("Bookings");

        builder.Property(b => b.ClientName).HasMaxLength(200).IsRequired();
        builder.Property(b => b.ClientEmail).HasMaxLength(256).IsRequired();
        builder.Property(b => b.ClientPhone).HasMaxLength(30);
        builder.Property(b => b.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(b => b.ServicePrice).HasColumnType("decimal(18,2)");
        builder.Property(b => b.DepositAmount).HasColumnType("decimal(18,2)");
        builder.Property(b => b.Notes).HasMaxLength(1000);

        builder.HasIndex(b => new { b.ProviderId, b.ScheduledStart });
        builder.HasIndex(b => b.Status);

        builder.HasOne(b => b.Service)
            .WithMany(s => s.Bookings)
            .HasForeignKey(b => b.ServiceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(b => b.Payments)
            .WithOne(p => p.Booking)
            .HasForeignKey(p => p.BookingId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");

        builder.Property(p => p.Purpose).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(p => p.Gateway).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(p => p.GatewayReference).HasMaxLength(200);
        builder.Property(p => p.Amount).HasColumnType("decimal(18,2)");
        builder.Property(p => p.Currency).HasMaxLength(10).IsRequired();
        builder.Property(p => p.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(p => p.GatewayReference);
        builder.HasIndex(p => p.ProviderId);

        builder.HasOne(p => p.Provider)
            .WithMany()
            .HasForeignKey(p => p.ProviderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
