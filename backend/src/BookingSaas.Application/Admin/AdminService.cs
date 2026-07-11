using BookingSaas.Application.Common.Exceptions;
using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Application.Common.Models;
using BookingSaas.Domain.Entities;
using BookingSaas.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BookingSaas.Application.Admin;

/// <summary>Backs every /admin/* route. Assumes the caller has already been authorized to
/// Admin/SuperAdmin at the controller level ([Authorize(Roles=...)]); still double-checks via
/// ICurrentUserService for defense in depth.</summary>
public class AdminService
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IPayoutProvider _payoutProvider;

    public AdminService(IApplicationDbContext db, ICurrentUserService currentUser, IPayoutProvider payoutProvider)
    {
        _db = db;
        _currentUser = currentUser;
        _payoutProvider = payoutProvider;
    }

    public async Task<AdminDashboardStatsDto> GetDashboardStatsAsync(CancellationToken ct = default)
    {
        _currentUser.EnsureAdmin();

        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var totalProviders = await _db.ProviderProfiles.CountAsync(ct);
        var activeProviders = await _db.ProviderProfiles.CountAsync(p => p.IsActive, ct);
        var totalBookings = await _db.Bookings.CountAsync(ct);
        var bookingsThisMonth = await _db.Bookings.CountAsync(b => b.CreatedAt >= monthStart, ct);
        var totalDeposits = await _db.Payments
            .Where(p => p.Purpose == PaymentPurpose.BookingDeposit && p.Status == PaymentStatus.Succeeded)
            .SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;
        var totalPayoutFees = await _db.WalletTransactions
            .Where(t => t.Type == WalletTransactionType.PayoutFee)
            .SumAsync(t => (decimal?)(-t.Amount), ct) ?? 0m;
        var pendingPayouts = await _db.PayoutRequests.CountAsync(p => p.Status == PayoutStatus.Pending, ct);
        var activeSubscriptions = await _db.ProviderSubscriptions.CountAsync(s => s.Status == SubscriptionStatus.Active, ct);
        var settings = await GetOrCreateSettingsAsync(ct);
        var mrr = activeSubscriptions * settings.SubscriptionPriceUsd;

        return new AdminDashboardStatsDto(totalProviders, activeProviders, totalBookings, bookingsThisMonth, totalDeposits, totalPayoutFees, pendingPayouts, activeSubscriptions, mrr);
    }

    public async Task<PagedResult<AdminProviderDto>> ListProvidersAsync(int page, int pageSize, CancellationToken ct = default)
    {
        _currentUser.EnsureAdmin();

        var query = _db.ProviderProfiles.Include(p => p.User).Include(p => p.Subscription).OrderBy(p => p.BusinessName);
        var total = await query.CountAsync(ct);
        var entities = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        var items = entities.Select(p => new AdminProviderDto(
            p.Id, p.BusinessName, p.Slug, p.User?.Email ?? string.Empty, p.Category, p.IsActive,
            p.Subscription?.Status, p.User?.CreatedAt ?? default)).ToList();

        return PagedResult<AdminProviderDto>.Create(items, page, pageSize, total);
    }

    public async Task<AdminProviderDetailDto> GetProviderAsync(Guid id, CancellationToken ct = default)
    {
        _currentUser.EnsureAdmin();

        var provider = await _db.ProviderProfiles
            .Include(p => p.User)
            .Include(p => p.Subscription)
            .Include(p => p.Wallet)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundException("ProviderProfile", id);

        var totalBookings = await _db.Bookings.CountAsync(b => b.ProviderId == id, ct);

        return new AdminProviderDetailDto(
            provider.Id, provider.BusinessName, provider.Slug, provider.User?.Email ?? string.Empty, provider.Category,
            provider.IsActive, provider.Subscription?.Status, provider.Subscription?.CurrentPeriodEnd,
            provider.Wallet?.AvailableBalance ?? 0m, provider.Wallet?.PendingBalance ?? 0m, totalBookings,
            provider.User?.CreatedAt ?? default);
    }

    public async Task SuspendProviderAsync(Guid id, CancellationToken ct = default)
    {
        _currentUser.EnsureAdmin();
        var provider = await _db.ProviderProfiles.FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundException("ProviderProfile", id);
        provider.IsActive = false;
        await _db.SaveChangesAsync(ct);
    }

    public async Task ActivateProviderAsync(Guid id, CancellationToken ct = default)
    {
        _currentUser.EnsureAdmin();
        var provider = await _db.ProviderProfiles.FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundException("ProviderProfile", id);
        provider.IsActive = true;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<Bookings.BookingDto>> ListBookingsAsync(int page, int pageSize, CancellationToken ct = default)
    {
        _currentUser.EnsureAdmin();

        var query = _db.Bookings.Include(b => b.Service).OrderByDescending(b => b.CreatedAt);
        var total = await query.CountAsync(ct);
        var entities = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        var items = entities.Select(b => new Bookings.BookingDto(
            b.Id, b.ProviderId, b.ServiceId, b.Service?.Name ?? string.Empty, b.ClientName, b.ClientEmail, b.ClientPhone,
            b.ScheduledStart, b.ScheduledEnd, b.Status, b.ServicePrice, b.DepositAmount, b.DepositPaid, b.Notes, b.CreatedAt)).ToList();

        return PagedResult<Bookings.BookingDto>.Create(items, page, pageSize, total);
    }

    public async Task<PagedResult<AdminPaymentDto>> ListPaymentsAsync(int page, int pageSize, CancellationToken ct = default)
    {
        _currentUser.EnsureAdmin();

        var query = _db.Payments.OrderByDescending(p => p.CreatedAt);
        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => new AdminPaymentDto(p.Id, p.BookingId, p.ProviderId, p.Purpose, p.Gateway, p.GatewayReference, p.Amount, p.Currency, p.Status, p.CreatedAt))
            .ToListAsync(ct);

        return PagedResult<AdminPaymentDto>.Create(items, page, pageSize, total);
    }

    public async Task<PagedResult<AdminPayoutDto>> ListPayoutsAsync(int page, int pageSize, CancellationToken ct = default)
    {
        _currentUser.EnsureAdmin();

        var query = _db.PayoutRequests.Include(p => p.Provider).OrderByDescending(p => p.CreatedAt);
        var total = await query.CountAsync(ct);
        var entities = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        var items = entities.Select(p => new AdminPayoutDto(
            p.Id, p.ProviderId, p.Provider?.BusinessName ?? string.Empty, p.Amount, p.FeeAmount, p.NetAmount,
            p.Method, p.Status, p.CreatedAt, p.ProcessedAt)).ToList();

        return PagedResult<AdminPayoutDto>.Create(items, page, pageSize, total);
    }

    public async Task<AdminPayoutDto> ApprovePayoutAsync(Guid id, CancellationToken ct = default)
    {
        _currentUser.EnsureAdmin();
        var payout = await _db.PayoutRequests.Include(p => p.Provider).FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundException("PayoutRequest", id);

        if (payout.Status != PayoutStatus.Pending)
            throw new ConflictException($"Payout cannot be approved from status {payout.Status}.");

        payout.Status = PayoutStatus.Processing;
        await _db.SaveChangesAsync(ct);

        var dispatch = await _payoutProvider.DispatchAsync(payout, ct);
        if (dispatch.Success)
        {
            payout.Status = PayoutStatus.Completed;
            payout.ProcessedAt = DateTime.UtcNow;
        }
        else
        {
            payout.Status = PayoutStatus.Failed;
            payout.ProcessedAt = DateTime.UtcNow;
            await ReverseWalletDebitAsync(payout, "Payout dispatch failed - reversed", ct);
        }

        await _db.SaveChangesAsync(ct);
        return new AdminPayoutDto(payout.Id, payout.ProviderId, payout.Provider?.BusinessName ?? string.Empty, payout.Amount, payout.FeeAmount, payout.NetAmount, payout.Method, payout.Status, payout.CreatedAt, payout.ProcessedAt);
    }

    public async Task<AdminPayoutDto> RejectPayoutAsync(Guid id, CancellationToken ct = default)
    {
        _currentUser.EnsureAdmin();
        var payout = await _db.PayoutRequests.Include(p => p.Provider).FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundException("PayoutRequest", id);

        if (payout.Status != PayoutStatus.Pending)
            throw new ConflictException($"Payout cannot be rejected from status {payout.Status}.");

        payout.Status = PayoutStatus.Failed;
        payout.ProcessedAt = DateTime.UtcNow;
        await ReverseWalletDebitAsync(payout, "Payout rejected by admin - reversed", ct);

        await _db.SaveChangesAsync(ct);
        return new AdminPayoutDto(payout.Id, payout.ProviderId, payout.Provider?.BusinessName ?? string.Empty, payout.Amount, payout.FeeAmount, payout.NetAmount, payout.Method, payout.Status, payout.CreatedAt, payout.ProcessedAt);
    }

    private async Task ReverseWalletDebitAsync(PayoutRequest payout, string description, CancellationToken ct)
    {
        var wallet = await _db.Wallets.FirstOrDefaultAsync(w => w.Id == payout.WalletId, ct);
        if (wallet is null) return;

        wallet.AvailableBalance += payout.Amount;

        _db.WalletTransactions.Add(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            Type = WalletTransactionType.PayoutDebit,
            Amount = payout.NetAmount,
            PayoutId = payout.Id,
            Description = description,
            CreatedAt = DateTime.UtcNow
        });
        _db.WalletTransactions.Add(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            Type = WalletTransactionType.PayoutFee,
            Amount = payout.FeeAmount,
            PayoutId = payout.Id,
            Description = description,
            CreatedAt = DateTime.UtcNow
        });
    }

    public async Task<PagedResult<AdminSubscriptionDto>> ListSubscriptionsAsync(int page, int pageSize, CancellationToken ct = default)
    {
        _currentUser.EnsureAdmin();

        var query = _db.ProviderSubscriptions.Include(s => s.Provider).OrderBy(s => s.Provider!.BusinessName);
        var total = await query.CountAsync(ct);
        var entities = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        var items = entities.Select(s => new AdminSubscriptionDto(
            s.Id, s.ProviderId, s.Provider?.BusinessName ?? string.Empty, s.Gateway, s.Status, s.CurrentPeriodEnd)).ToList();

        return PagedResult<AdminSubscriptionDto>.Create(items, page, pageSize, total);
    }

    public async Task<PlatformSettingsDto> GetSettingsAsync(CancellationToken ct = default)
    {
        _currentUser.EnsureAdmin();
        var settings = await GetOrCreateSettingsAsync(ct);
        return new PlatformSettingsDto(settings.SubscriptionPriceUsd, settings.PayoutFeePercentage, settings.PayoutFeeFixedUsd);
    }

    public async Task<PlatformSettingsDto> UpdateSettingsAsync(UpdatePlatformSettingsRequest request, CancellationToken ct = default)
    {
        _currentUser.EnsureAdmin();
        var settings = await GetOrCreateSettingsAsync(ct);

        settings.SubscriptionPriceUsd = request.SubscriptionPriceUsd;
        settings.PayoutFeePercentage = request.PayoutFeePercentage;
        settings.PayoutFeeFixedUsd = request.PayoutFeeFixedUsd;

        await _db.SaveChangesAsync(ct);
        return new PlatformSettingsDto(settings.SubscriptionPriceUsd, settings.PayoutFeePercentage, settings.PayoutFeeFixedUsd);
    }

    private async Task<PlatformSettings> GetOrCreateSettingsAsync(CancellationToken ct)
    {
        var settings = await _db.PlatformSettings.FirstOrDefaultAsync(ct);
        if (settings is not null) return settings;

        settings = new PlatformSettings();
        _db.PlatformSettings.Add(settings);
        await _db.SaveChangesAsync(ct);
        return settings;
    }
}
