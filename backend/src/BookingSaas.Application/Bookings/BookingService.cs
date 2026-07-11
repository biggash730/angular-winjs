using BookingSaas.Application.Common.Exceptions;
using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Application.Common.Models;
using BookingSaas.Domain.Entities;
using BookingSaas.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BookingSaas.Application.Bookings;

/// <summary>Implements the booking lifecycle and the "money flow" rules from ARCHITECTURE.md:
/// deposit capture -> Wallet.PendingBalance, release to AvailableBalance on Completed, refund on
/// Cancelled.</summary>
public class BookingService
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IEnumerable<IPaymentGateway> _gateways;

    public BookingService(IApplicationDbContext db, ICurrentUserService currentUser, IEnumerable<IPaymentGateway> gateways)
    {
        _db = db;
        _currentUser = currentUser;
        _gateways = gateways;
    }

    public async Task<CreatePublicBookingResponse> CreatePublicBookingAsync(CreatePublicBookingRequest request, CancellationToken ct = default)
    {
        var provider = await _db.ProviderProfiles
            .Include(p => p.Subscription)
            .FirstOrDefaultAsync(p => p.Slug == request.Slug, ct)
            ?? throw new NotFoundException("Provider", request.Slug);

        var subscriptionOk = provider.Subscription is { Status: SubscriptionStatus.Active or SubscriptionStatus.Trialing };
        if (!provider.IsActive || !subscriptionOk)
            throw new ConflictException("This provider is not currently accepting bookings.");

        var service = await _db.Services
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.ProviderId == provider.Id && s.IsActive, ct)
            ?? throw new NotFoundException("Service", request.ServiceId);

        var scheduledEnd = request.ScheduledStart.AddMinutes(service.DurationMinutes);

        var overlaps = await _db.Bookings.AnyAsync(b =>
            b.ProviderId == provider.Id &&
            (b.Status == BookingStatus.PendingPayment || b.Status == BookingStatus.Confirmed) &&
            request.ScheduledStart < b.ScheduledEnd && scheduledEnd > b.ScheduledStart, ct);
        if (overlaps)
            throw new ConflictException("This time slot is no longer available.");

        var depositAmount = Math.Round(service.Price * service.DepositPercentage / 100m, 2, MidpointRounding.AwayFromZero);
        var gatewayType = request.Gateway ?? PaymentGatewayType.Stripe;

        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            ProviderId = provider.Id,
            ServiceId = service.Id,
            ClientName = request.ClientName,
            ClientEmail = request.ClientEmail,
            ClientPhone = request.ClientPhone,
            ScheduledStart = request.ScheduledStart,
            ScheduledEnd = scheduledEnd,
            ServicePrice = service.Price,
            DepositAmount = depositAmount,
            DepositPaid = false,
            Status = BookingStatus.PendingPayment,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };
        _db.Bookings.Add(booking);

        // Zero-deposit services need no payment step: confirm immediately.
        if (depositAmount <= 0)
        {
            booking.Status = BookingStatus.Confirmed;
            booking.DepositPaid = true;
            await _db.SaveChangesAsync(ct);
            return new CreatePublicBookingResponse(booking.Id, 0m, "usd", gatewayType, null, null, null, null, null);
        }

        var gateway = ResolveGateway(gatewayType);
        var initResult = await gateway.InitiateDepositAsync(booking, depositAmount, "usd", ct);

        _db.Payments.Add(new Payment
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            ProviderId = provider.Id,
            Purpose = PaymentPurpose.BookingDeposit,
            Gateway = gatewayType,
            GatewayReference = initResult.GatewayReference,
            Amount = depositAmount,
            Currency = "usd",
            Status = PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(ct);

        return new CreatePublicBookingResponse(
            booking.Id, depositAmount, "usd", gatewayType,
            initResult.StripeClientSecret, initResult.StripePublishableKey,
            initResult.PaystackAccessCode, initResult.PaystackPublicKey, initResult.PaystackReference);
    }

    public async Task<PublicBookingStatusDto> GetPublicStatusAsync(Guid id, CancellationToken ct = default)
    {
        var booking = await _db.Bookings.Include(b => b.Service).FirstOrDefaultAsync(b => b.Id == id, ct)
            ?? throw new NotFoundException("Booking", id);

        return new PublicBookingStatusDto(
            booking.Id, booking.Status, booking.Service?.Name ?? string.Empty,
            booking.ScheduledStart, booking.ScheduledEnd, booking.ServicePrice, booking.DepositAmount, booking.DepositPaid);
    }

    public async Task<PagedResult<BookingDto>> ListAsync(BookingStatus? status, DateTime? from, DateTime? to, int page, int pageSize, CancellationToken ct = default)
    {
        _currentUser.EnsureProvider();
        var providerId = _currentUser.ProviderId!.Value;

        var query = _db.Bookings.Include(b => b.Service).Where(b => b.ProviderId == providerId);
        if (status is not null) query = query.Where(b => b.Status == status);
        if (from is not null) query = query.Where(b => b.ScheduledStart >= from);
        if (to is not null) query = query.Where(b => b.ScheduledStart <= to);

        var total = await query.CountAsync(ct);
        var entities = await query
            .OrderByDescending(b => b.ScheduledStart)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
        // Projected in-memory (not inside the EF Select) because Map isn't expression-tree
        // translatable to SQL.
        var items = entities.Select(Map).ToList();

        return PagedResult<BookingDto>.Create(items, page, pageSize, total);
    }

    public async Task<BookingDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var booking = await GetOwnedEntityAsync(id, ct);
        return Map(booking);
    }

    public async Task<BookingDto> ConfirmAsync(Guid id, CancellationToken ct = default)
    {
        var booking = await GetOwnedEntityAsync(id, ct);
        if (booking.Status != BookingStatus.PendingPayment)
            throw new ConflictException($"Booking cannot be confirmed from status {booking.Status}.");

        booking.Status = BookingStatus.Confirmed;
        await _db.SaveChangesAsync(ct);
        return Map(booking);
    }

    public async Task<BookingDto> CancelAsync(Guid id, CancellationToken ct = default)
    {
        var booking = await GetOwnedEntityAsync(id, ct);
        if (booking.Status is BookingStatus.Cancelled or BookingStatus.Completed or BookingStatus.NoShow)
            throw new ConflictException($"Booking cannot be cancelled from status {booking.Status}.");

        if (booking.DepositPaid && booking.DepositAmount > 0)
        {
            var payment = await _db.Payments
                .Where(p => p.BookingId == booking.Id && p.Purpose == PaymentPurpose.BookingDeposit && p.Status == PaymentStatus.Succeeded)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync(ct);

            if (payment is not null)
            {
                var gateway = ResolveGateway(payment.Gateway);
                var refund = await gateway.RefundAsync(payment, ct);
                if (!refund.Success)
                    throw new ConflictException($"Refund failed: {refund.FailureReason ?? "unknown gateway error"}.");

                payment.Status = PaymentStatus.Refunded;

                var wallet = await _db.Wallets.FirstOrDefaultAsync(w => w.ProviderId == booking.ProviderId, ct)
                    ?? throw new NotFoundException("Wallet", booking.ProviderId);
                wallet.PendingBalance -= booking.DepositAmount;

                _db.WalletTransactions.Add(new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = wallet.Id,
                    Type = WalletTransactionType.Refund,
                    Amount = -booking.DepositAmount,
                    BookingId = booking.Id,
                    Description = "Deposit refunded on cancellation",
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        booking.Status = BookingStatus.Cancelled;
        await _db.SaveChangesAsync(ct);
        return Map(booking);
    }

    public async Task<BookingDto> CompleteAsync(Guid id, CancellationToken ct = default)
    {
        var booking = await GetOwnedEntityAsync(id, ct);
        if (booking.Status != BookingStatus.Confirmed)
            throw new ConflictException($"Booking cannot be completed from status {booking.Status}.");

        if (booking.DepositPaid && booking.DepositAmount > 0)
        {
            var wallet = await _db.Wallets.FirstOrDefaultAsync(w => w.ProviderId == booking.ProviderId, ct)
                ?? throw new NotFoundException("Wallet", booking.ProviderId);

            wallet.PendingBalance -= booking.DepositAmount;
            wallet.AvailableBalance += booking.DepositAmount;

            _db.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                Type = WalletTransactionType.DepositReleased,
                Amount = booking.DepositAmount,
                BookingId = booking.Id,
                Description = "Deposit released on completion",
                CreatedAt = DateTime.UtcNow
            });
        }

        booking.Status = BookingStatus.Completed;
        await _db.SaveChangesAsync(ct);
        return Map(booking);
    }

    private async Task<Booking> GetOwnedEntityAsync(Guid id, CancellationToken ct)
    {
        var booking = await _db.Bookings.Include(b => b.Service).FirstOrDefaultAsync(b => b.Id == id, ct)
            ?? throw new NotFoundException("Booking", id);

        if (_currentUser.Role is AppRole.Admin or AppRole.SuperAdmin)
            return booking;

        _currentUser.EnsureProvider();
        if (booking.ProviderId != _currentUser.ProviderId)
            throw new ForbiddenException("This booking does not belong to your account.");

        return booking;
    }

    private IPaymentGateway ResolveGateway(PaymentGatewayType type) =>
        _gateways.FirstOrDefault(g => g.GatewayType == type)
            ?? throw new BadRequestException($"Payment gateway '{type}' is not configured.");

    private static BookingDto Map(Booking b) => new(
        b.Id, b.ProviderId, b.ServiceId, b.Service?.Name ?? string.Empty, b.ClientName, b.ClientEmail, b.ClientPhone,
        b.ScheduledStart, b.ScheduledEnd, b.Status, b.ServicePrice, b.DepositAmount, b.DepositPaid, b.Notes, b.CreatedAt);
}
