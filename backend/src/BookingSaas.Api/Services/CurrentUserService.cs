using System.Security.Claims;
using BookingSaas.Application.Common.Exceptions;
using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Domain.Enums;

namespace BookingSaas.Api.Services;

/// <summary>Reads the caller's identity out of the current JWT (via IHttpContextAccessor - a
/// hosting concern, which is why this lives in the API layer rather than Infrastructure).</summary>
public class CurrentUserService : ICurrentUserService
{
    private const string ProviderIdClaim = "providerId";
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public Guid UserId
    {
        get
        {
            var sub = User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? User?.FindFirstValue("sub");
            return sub is not null && Guid.TryParse(sub, out var id) ? id : Guid.Empty;
        }
    }

    public string? Email => User?.FindFirstValue(ClaimTypes.Email);

    public AppRole Role
    {
        get
        {
            var role = User?.FindFirstValue(ClaimTypes.Role);
            return role is not null && Enum.TryParse<AppRole>(role, out var parsed) ? parsed : default;
        }
    }

    public Guid? ProviderId
    {
        get
        {
            var value = User?.FindFirstValue(ProviderIdClaim);
            return value is not null && Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public void EnsureAuthenticated()
    {
        if (!IsAuthenticated) throw new ForbiddenException("Authentication is required.");
    }

    public void EnsureProvider()
    {
        EnsureAuthenticated();
        if (Role != AppRole.Provider || ProviderId is null)
            throw new ForbiddenException("This action is only available to providers.");
    }

    public void EnsureAdmin()
    {
        EnsureAuthenticated();
        if (Role is not (AppRole.Admin or AppRole.SuperAdmin))
            throw new ForbiddenException("This action is only available to administrators.");
    }
}
