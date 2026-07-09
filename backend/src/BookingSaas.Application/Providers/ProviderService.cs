using BookingSaas.Application.Common.Exceptions;
using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BookingSaas.Application.Providers;

public class ProviderService
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ProviderService(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<ProviderProfileDto> GetMeAsync(CancellationToken ct = default)
    {
        _currentUser.EnsureProvider();
        var provider = await GetOwnProviderAsync(ct);
        return Map(provider);
    }

    public async Task<ProviderProfileDto> UpdateMeAsync(UpdateProviderProfileRequest request, CancellationToken ct = default)
    {
        _currentUser.EnsureProvider();
        var provider = await GetOwnProviderAsync(ct);

        provider.BusinessName = request.BusinessName;
        provider.Category = request.Category;
        provider.Bio = request.Bio;
        provider.LogoUrl = request.LogoUrl;
        provider.CoverImageUrl = request.CoverImageUrl;
        provider.BrandColor = request.BrandColor;
        provider.Address = request.Address;
        provider.Phone = request.Phone;
        provider.Timezone = request.Timezone;

        await _db.SaveChangesAsync(ct);
        return Map(provider);
    }

    public async Task<PublicProviderDto> GetPublicProviderAsync(string slug, CancellationToken ct = default)
    {
        var provider = await _db.ProviderProfiles
            .Include(p => p.Services)
            .Include(p => p.WorkingHours)
            .Include(p => p.Subscription)
            .FirstOrDefaultAsync(p => p.Slug == slug, ct)
            ?? throw new NotFoundException("Provider", slug);

        var subscriptionOk = provider.Subscription is { Status: SubscriptionStatus.Active or SubscriptionStatus.Trialing };
        var isAccepting = provider.IsActive && subscriptionOk;

        return new PublicProviderDto(
            provider.Id,
            provider.BusinessName,
            provider.Slug,
            provider.Category,
            provider.Bio,
            provider.LogoUrl,
            provider.CoverImageUrl,
            provider.BrandColor,
            provider.Address,
            provider.Phone,
            provider.Timezone,
            isAccepting,
            provider.Services.Where(s => s.IsActive)
                .Select(s => new PublicServiceDto(s.Id, s.Name, s.Description, s.DurationMinutes, s.Price, s.DepositPercentage))
                .ToList(),
            provider.WorkingHours
                .OrderBy(w => w.DayOfWeek)
                .Select(w => new PublicWorkingHoursDto(w.DayOfWeek, w.StartTime.ToString(@"hh\:mm"), w.EndTime.ToString(@"hh\:mm"), w.IsClosed))
                .ToList());
    }

    internal async Task<Domain.Entities.ProviderProfile> GetOwnProviderAsync(CancellationToken ct = default)
    {
        var providerId = _currentUser.ProviderId ?? throw new ForbiddenException("No provider profile for this account.");
        return await _db.ProviderProfiles.FirstOrDefaultAsync(p => p.Id == providerId, ct)
            ?? throw new NotFoundException("ProviderProfile", providerId);
    }

    private static ProviderProfileDto Map(Domain.Entities.ProviderProfile p) => new(
        p.Id, p.BusinessName, p.Slug, p.Category, p.Bio, p.LogoUrl, p.CoverImageUrl,
        p.BrandColor, p.Address, p.Phone, p.Timezone, p.IsActive);
}
