using BookingSaas.Domain.Enums;

namespace BookingSaas.Application.Common.Interfaces;

/// <summary>Reads the authenticated caller's identity out of the current JWT. Implemented in the
/// API layer (needs IHttpContextAccessor, a hosting concern) and consumed by Application services.</summary>
public interface ICurrentUserService
{
    bool IsAuthenticated { get; }
    Guid UserId { get; }
    string? Email { get; }
    AppRole Role { get; }

    /// <summary>Id of the caller's ProviderProfile, populated for Role == Provider only.</summary>
    Guid? ProviderId { get; }

    void EnsureAuthenticated();
    void EnsureProvider();
    void EnsureAdmin();
}
