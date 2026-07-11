using BookingSaas.Application.Common.Exceptions;
using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Domain.Enums;

namespace BookingSaas.Tests.TestSupport;

public class FakeCurrentUserService : ICurrentUserService
{
    public bool IsAuthenticated { get; set; } = true;
    public Guid UserId { get; set; } = Guid.NewGuid();
    public string? Email { get; set; } = "provider@example.com";
    public AppRole Role { get; set; } = AppRole.Provider;
    public Guid? ProviderId { get; set; }

    public void EnsureAuthenticated()
    {
        if (!IsAuthenticated) throw new ForbiddenException();
    }

    public void EnsureProvider()
    {
        EnsureAuthenticated();
        if (Role != AppRole.Provider || ProviderId is null) throw new ForbiddenException();
    }

    public void EnsureAdmin()
    {
        EnsureAuthenticated();
        if (Role is not (AppRole.Admin or AppRole.SuperAdmin)) throw new ForbiddenException();
    }
}
