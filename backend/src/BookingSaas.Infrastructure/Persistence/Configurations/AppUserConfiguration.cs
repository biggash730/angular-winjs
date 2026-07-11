using BookingSaas.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BookingSaas.Infrastructure.Persistence.Configurations;

public class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        builder.Property(u => u.Role).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(u => u.CreatedAt).IsRequired();

        builder.HasOne(u => u.ProviderProfile)
            .WithOne(p => p.User)
            .HasForeignKey<ProviderProfile>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
