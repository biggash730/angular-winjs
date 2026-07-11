using BookingSaas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BookingSaas.Infrastructure.Persistence.Configurations;

public class WalletConfiguration : IEntityTypeConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> builder)
    {
        builder.ToTable("Wallets");

        builder.Property(w => w.AvailableBalance).HasColumnType("decimal(18,2)");
        builder.Property(w => w.PendingBalance).HasColumnType("decimal(18,2)");
        builder.Property(w => w.Currency).HasMaxLength(10).IsRequired();

        builder.HasIndex(w => w.ProviderId).IsUnique();

        builder.HasMany(w => w.Transactions)
            .WithOne(t => t.Wallet)
            .HasForeignKey(t => t.WalletId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(w => w.PayoutRequests)
            .WithOne(p => p.Wallet)
            .HasForeignKey(p => p.WalletId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class WalletTransactionConfiguration : IEntityTypeConfiguration<WalletTransaction>
{
    public void Configure(EntityTypeBuilder<WalletTransaction> builder)
    {
        builder.ToTable("WalletTransactions");

        builder.Property(t => t.Type).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(t => t.Amount).HasColumnType("decimal(18,2)");
        builder.Property(t => t.Description).HasMaxLength(500);

        builder.HasIndex(t => t.WalletId);

        builder.HasOne(t => t.Booking)
            .WithMany()
            .HasForeignKey(t => t.BookingId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(t => t.Payout)
            .WithMany(p => p.Transactions)
            .HasForeignKey(t => t.PayoutId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

public class PayoutRequestConfiguration : IEntityTypeConfiguration<PayoutRequest>
{
    public void Configure(EntityTypeBuilder<PayoutRequest> builder)
    {
        builder.ToTable("PayoutRequests");

        builder.Property(p => p.Amount).HasColumnType("decimal(18,2)");
        builder.Property(p => p.FeeAmount).HasColumnType("decimal(18,2)");
        builder.Property(p => p.NetAmount).HasColumnType("decimal(18,2)");
        builder.Property(p => p.Method).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(p => p.DestinationJson).HasColumnType("jsonb").IsRequired();
        builder.Property(p => p.Status).HasConversion<string>().HasMaxLength(20).IsRequired();

        builder.HasIndex(p => p.ProviderId);
        builder.HasIndex(p => p.Status);

        builder.HasOne(p => p.Provider)
            .WithMany()
            .HasForeignKey(p => p.ProviderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
