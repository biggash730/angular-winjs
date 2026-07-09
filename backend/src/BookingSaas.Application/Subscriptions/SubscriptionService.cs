using BookingSaas.Application.Common.Exceptions;
using BookingSaas.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BookingSaas.Application.Subscriptions;

public class SubscriptionService
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IEnumerable<IPaymentGateway> _gateways;

    public SubscriptionService(IApplicationDbContext db, ICurrentUserService currentUser, IEnumerable<IPaymentGateway> gateways)
    {
        _db = db;
        _currentUser = currentUser;
        _gateways = gateways;
    }

    public async Task<SubscriptionCheckoutResponse> CheckoutAsync(SubscriptionCheckoutRequest request, CancellationToken ct = default)
    {
        _currentUser.EnsureProvider();
        var providerId = _currentUser.ProviderId!.Value;

        var provider = await _db.ProviderProfiles.FirstOrDefaultAsync(p => p.Id == providerId, ct)
            ?? throw new NotFoundException("ProviderProfile", providerId);

        var subscription = await _db.ProviderSubscriptions.FirstOrDefaultAsync(s => s.ProviderId == providerId, ct)
            ?? throw new NotFoundException("ProviderSubscription", providerId);

        subscription.Gateway = request.Gateway;

        var gateway = _gateways.FirstOrDefault(g => g.GatewayType == request.Gateway)
            ?? throw new BadRequestException($"Payment gateway '{request.Gateway}' is not configured.");

        var result = await gateway.InitiateSubscriptionCheckoutAsync(provider, subscription, ct);
        await _db.SaveChangesAsync(ct);

        return new SubscriptionCheckoutResponse(request.Gateway, result.StripeCheckoutUrl, result.PaystackAuthorizationUrl, result.PaystackAccessCode, result.PaystackReference);
    }

    public async Task<SubscriptionDto> GetMeAsync(CancellationToken ct = default)
    {
        _currentUser.EnsureProvider();
        var providerId = _currentUser.ProviderId!.Value;

        var subscription = await _db.ProviderSubscriptions
            .Include(s => s.Plan)
            .FirstOrDefaultAsync(s => s.ProviderId == providerId, ct)
            ?? throw new NotFoundException("ProviderSubscription", providerId);

        return new SubscriptionDto(subscription.Id, subscription.Gateway, subscription.Status, subscription.CurrentPeriodEnd, subscription.Plan?.PriceUsd ?? 5.00m);
    }
}
