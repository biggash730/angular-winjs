using BookingSaas.Application.Common;
using BookingSaas.Application.Common.Exceptions;
using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Domain.Entities;
using BookingSaas.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BookingSaas.Application.Auth;

public class AuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IApplicationDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly ICurrentUserService _currentUser;

    /// <summary>v1 trial length for a brand-new provider (no such rule is specified in
    /// ARCHITECTURE.md; a 14-day trial keeps the storefront live immediately after signup without
    /// requiring a card up front). See README "Design notes".</summary>
    private static readonly TimeSpan TrialLength = TimeSpan.FromDays(14);

    public AuthService(UserManager<AppUser> userManager, IApplicationDbContext db, ITokenService tokenService, ICurrentUserService currentUser)
    {
        _userManager = userManager;
        _db = db;
        _tokenService = tokenService;
        _currentUser = currentUser;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
            throw new ConflictException("An account with this email already exists.");

        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            Role = AppRole.Provider,
            CreatedAt = DateTime.UtcNow
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
            throw new BadRequestException(string.Join(" ", createResult.Errors.Select(e => e.Description)));

        var slug = await GenerateUniqueSlugAsync(request.BusinessName, ct);
        var now = DateTime.UtcNow;

        var provider = new ProviderProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            BusinessName = request.BusinessName,
            Slug = slug,
            Category = request.Category,
            Timezone = "UTC",
            IsActive = true
        };
        _db.ProviderProfiles.Add(provider);

        _db.Wallets.Add(new Domain.Entities.Wallet
        {
            Id = Guid.NewGuid(),
            ProviderId = provider.Id,
            AvailableBalance = 0,
            PendingBalance = 0,
            Currency = "usd"
        });

        var plan = await _db.SubscriptionPlans.FirstOrDefaultAsync(ct);
        _db.ProviderSubscriptions.Add(new ProviderSubscription
        {
            Id = Guid.NewGuid(),
            ProviderId = provider.Id,
            PlanId = plan?.Id ?? Guid.Empty,
            Gateway = PaymentGatewayType.Stripe,
            Status = SubscriptionStatus.Trialing,
            CurrentPeriodEnd = now.Add(TrialLength)
        });

        await _db.SaveChangesAsync(ct);

        return BuildAuthResponse(user, provider);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email)
            ?? throw new BadRequestException("Invalid email or password.");

        var validPassword = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!validPassword)
            throw new BadRequestException("Invalid email or password.");

        var provider = await _db.ProviderProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id, ct);
        return BuildAuthResponse(user, provider);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request, CancellationToken ct = default)
    {
        var userId = _tokenService.ValidateRefreshToken(request.RefreshToken)
            ?? throw new BadRequestException("Invalid or expired refresh token.");

        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new BadRequestException("Invalid or expired refresh token.");

        var provider = await _db.ProviderProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id, ct);
        return BuildAuthResponse(user, provider);
    }

    public async Task<UserDto> GetMeAsync(CancellationToken ct = default)
    {
        _currentUser.EnsureAuthenticated();
        var user = await _userManager.FindByIdAsync(_currentUser.UserId.ToString())
            ?? throw new NotFoundException("User", _currentUser.UserId);

        var provider = await _db.ProviderProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id, ct);
        return MapUser(user, provider);
    }

    private AuthResponse BuildAuthResponse(AppUser user, ProviderProfile? provider)
    {
        var access = _tokenService.GenerateAccessToken(user, provider?.Id);
        var refresh = _tokenService.GenerateRefreshToken(user);
        return new AuthResponse(access, refresh, MapUser(user, provider));
    }

    private static UserDto MapUser(AppUser user, ProviderProfile? provider) =>
        new(user.Id, user.Email!, user.Role, user.CreatedAt, provider?.Id, provider?.Slug);

    private async Task<string> GenerateUniqueSlugAsync(string businessName, CancellationToken ct)
    {
        var baseSlug = SlugHelper.Slugify(businessName);
        var slug = baseSlug;
        var suffix = 1;
        while (await _db.ProviderProfiles.AnyAsync(p => p.Slug == slug, ct))
        {
            suffix++;
            slug = $"{baseSlug}-{suffix}";
        }
        return slug;
    }
}
