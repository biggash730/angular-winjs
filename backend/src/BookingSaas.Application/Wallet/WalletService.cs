using System.Text.Json;
using BookingSaas.Application.Common.Exceptions;
using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Application.Common.Models;
using BookingSaas.Domain.Entities;
using BookingSaas.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BookingSaas.Application.Wallet;

public class WalletService
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public WalletService(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<WalletDto> GetWalletAsync(CancellationToken ct = default)
    {
        var wallet = await GetOwnWalletAsync(ct);
        return Map(wallet);
    }

    public async Task<PagedResult<WalletTransactionDto>> GetTransactionsAsync(int page, int pageSize, CancellationToken ct = default)
    {
        var wallet = await GetOwnWalletAsync(ct);

        var query = _db.WalletTransactions.Where(t => t.WalletId == wallet.Id);
        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new WalletTransactionDto(t.Id, t.Type, t.Amount, t.BookingId, t.PayoutId, t.Description, t.CreatedAt))
            .ToListAsync(ct);

        return PagedResult<WalletTransactionDto>.Create(items, page, pageSize, total);
    }

    public async Task<PayoutRequestDto> RequestPayoutAsync(CreatePayoutRequest request, CancellationToken ct = default)
    {
        var wallet = await GetOwnWalletAsync(ct);

        if (request.Amount > wallet.AvailableBalance)
            throw new ConflictException("Requested payout amount exceeds available balance.");

        var settings = await _db.PlatformSettings.FirstOrDefaultAsync(ct)
            ?? new PlatformSettings();

        var (feeAmount, netAmount) = PayoutFeeCalculator.Calculate(request.Amount, settings.PayoutFeePercentage, settings.PayoutFeeFixedUsd);
        if (netAmount <= 0)
            throw new ConflictException("Payout amount is too small to cover the platform fee.");

        var payout = new PayoutRequest
        {
            Id = Guid.NewGuid(),
            ProviderId = wallet.ProviderId,
            WalletId = wallet.Id,
            Amount = request.Amount,
            FeeAmount = feeAmount,
            NetAmount = netAmount,
            Method = request.Method,
            DestinationJson = JsonSerializer.Serialize(request.Destination),
            Status = PayoutStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        _db.PayoutRequests.Add(payout);

        wallet.AvailableBalance -= request.Amount;

        _db.WalletTransactions.Add(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            Type = WalletTransactionType.PayoutDebit,
            Amount = -netAmount,
            PayoutId = payout.Id,
            Description = "Payout requested",
            CreatedAt = DateTime.UtcNow
        });
        _db.WalletTransactions.Add(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            Type = WalletTransactionType.PayoutFee,
            Amount = -feeAmount,
            PayoutId = payout.Id,
            Description = "Platform payout fee",
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(ct);
        return Map(payout);
    }

    public async Task<PagedResult<PayoutRequestDto>> ListPayoutsAsync(int page, int pageSize, CancellationToken ct = default)
    {
        var wallet = await GetOwnWalletAsync(ct);

        var query = _db.PayoutRequests.Where(p => p.WalletId == wallet.Id);
        var total = await query.CountAsync(ct);
        var entities = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return PagedResult<PayoutRequestDto>.Create(entities.Select(Map).ToList(), page, pageSize, total);
    }

    private async Task<Domain.Entities.Wallet> GetOwnWalletAsync(CancellationToken ct)
    {
        _currentUser.EnsureProvider();
        var providerId = _currentUser.ProviderId!.Value;
        return await _db.Wallets.FirstOrDefaultAsync(w => w.ProviderId == providerId, ct)
            ?? throw new NotFoundException("Wallet", providerId);
    }

    private static WalletDto Map(Domain.Entities.Wallet w) => new(w.Id, w.AvailableBalance, w.PendingBalance, w.Currency);

    private static PayoutRequestDto Map(PayoutRequest p) => new(p.Id, p.Amount, p.FeeAmount, p.NetAmount, p.Method, p.Status, p.CreatedAt, p.ProcessedAt);
}
