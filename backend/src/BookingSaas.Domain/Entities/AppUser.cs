using BookingSaas.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace BookingSaas.Domain.Entities;

/// <summary>
/// Application user. Inherits ASP.NET Core Identity's <see cref="IdentityUser{TKey}"/> so
/// Infrastructure can wire up Identity (password hashing, user store) without a parallel user
/// model. This is the one deliberate exception to "Domain has no dependencies": it takes a
/// single NuGet package reference (Microsoft.AspNetCore.Identity, contracts-only, no EF Core)
/// and no project references, so the "no project references out of Domain" rule still holds.
/// See backend/README.md "Design notes".
/// </summary>
public class AppUser : IdentityUser<Guid>
{
    public AppRole Role { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ProviderProfile? ProviderProfile { get; set; }
}
