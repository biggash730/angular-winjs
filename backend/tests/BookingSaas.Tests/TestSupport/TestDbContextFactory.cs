using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BookingSaas.Tests.TestSupport;

public static class TestDbContextFactory
{
    /// <summary>Fresh in-memory-provider BookingSaasDbContext, isolated per test via a unique
    /// database name. Cast to IApplicationDbContext to hand to the Application services under
    /// test, matching how they're consumed in production.</summary>
    public static IApplicationDbContext Create()
    {
        var options = new DbContextOptionsBuilder<BookingSaasDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new BookingSaasDbContext(options);
    }
}
