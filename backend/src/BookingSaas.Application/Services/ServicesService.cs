using BookingSaas.Application.Common.Exceptions;
using BookingSaas.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BookingSaas.Application.Services;

public class ServicesService
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ServicesService(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<ServiceDto>> ListAsync(CancellationToken ct = default)
    {
        _currentUser.EnsureProvider();
        var providerId = _currentUser.ProviderId!.Value;
        var entities = await _db.Services
            .Where(s => s.ProviderId == providerId)
            .OrderBy(s => s.Name)
            .ToListAsync(ct);
        // Projected in-memory (not inside the EF Select) because Map isn't expression-tree
        // translatable to SQL.
        return entities.Select(Map).ToList();
    }

    public async Task<ServiceDto> CreateAsync(CreateServiceRequest request, CancellationToken ct = default)
    {
        _currentUser.EnsureProvider();
        var providerId = _currentUser.ProviderId!.Value;

        var service = new Domain.Entities.Service
        {
            Id = Guid.NewGuid(),
            ProviderId = providerId,
            Name = request.Name,
            Description = request.Description,
            DurationMinutes = request.DurationMinutes,
            Price = request.Price,
            DepositPercentage = request.DepositPercentage,
            IsActive = true
        };
        _db.Services.Add(service);
        await _db.SaveChangesAsync(ct);
        return Map(service);
    }

    public async Task<ServiceDto> UpdateAsync(Guid id, UpdateServiceRequest request, CancellationToken ct = default)
    {
        _currentUser.EnsureProvider();
        var service = await GetOwnedAsync(id, ct);

        service.Name = request.Name;
        service.Description = request.Description;
        service.DurationMinutes = request.DurationMinutes;
        service.Price = request.Price;
        service.DepositPercentage = request.DepositPercentage;
        service.IsActive = request.IsActive;

        await _db.SaveChangesAsync(ct);
        return Map(service);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        _currentUser.EnsureProvider();
        var service = await GetOwnedAsync(id, ct);
        _db.Services.Remove(service);
        await _db.SaveChangesAsync(ct);
    }

    private async Task<Domain.Entities.Service> GetOwnedAsync(Guid id, CancellationToken ct)
    {
        var providerId = _currentUser.ProviderId!.Value;
        var service = await _db.Services.FirstOrDefaultAsync(s => s.Id == id, ct)
            ?? throw new NotFoundException("Service", id);
        if (service.ProviderId != providerId)
            throw new ForbiddenException("This service does not belong to your account.");
        return service;
    }

    private static ServiceDto Map(Domain.Entities.Service s) =>
        new(s.Id, s.Name, s.Description, s.DurationMinutes, s.Price, s.DepositPercentage, s.IsActive);
}
