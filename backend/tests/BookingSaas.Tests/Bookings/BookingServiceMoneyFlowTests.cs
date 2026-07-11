using BookingSaas.Application.Bookings;
using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Domain.Entities;
using BookingSaas.Domain.Enums;
using BookingSaas.Tests.TestSupport;
using Moq;
using Xunit;

namespace BookingSaas.Tests.Bookings;

/// <summary>Covers the "money flow" rules from ARCHITECTURE.md: a Completed booking releases its
/// held deposit from Wallet.PendingBalance to Wallet.AvailableBalance; a Cancelled booking with a
/// paid deposit refunds it through the original gateway and reverses the pending hold.</summary>
public class BookingServiceMoneyFlowTests
{
    private static (IApplicationDbContext db, FakeCurrentUserService currentUser, ProviderProfile provider, Domain.Entities.Wallet wallet, Booking booking, Payment payment) SeedConfirmedBookingWithDeposit(decimal depositAmount = 40m)
    {
        var db = TestDbContextFactory.Create();

        var userId = Guid.NewGuid();
        var provider = new ProviderProfile
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BusinessName = "Jane's Studio",
            Slug = "janes-studio",
            Category = ProviderCategory.Hairdresser,
            Timezone = "UTC",
            IsActive = true
        };
        var service = new Service
        {
            Id = Guid.NewGuid(),
            ProviderId = provider.Id,
            Name = "Haircut",
            DurationMinutes = 60,
            Price = 100m,
            DepositPercentage = 40,
            IsActive = true
        };
        var wallet = new Domain.Entities.Wallet
        {
            Id = Guid.NewGuid(),
            ProviderId = provider.Id,
            AvailableBalance = 0m,
            PendingBalance = depositAmount,
            Currency = "usd"
        };
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            ProviderId = provider.Id,
            ServiceId = service.Id,
            ClientName = "Alex Client",
            ClientEmail = "alex@example.com",
            ScheduledStart = DateTime.UtcNow.AddDays(1),
            ScheduledEnd = DateTime.UtcNow.AddDays(1).AddHours(1),
            ServicePrice = service.Price,
            DepositAmount = depositAmount,
            DepositPaid = true,
            Status = BookingStatus.Confirmed,
            CreatedAt = DateTime.UtcNow
        };
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            ProviderId = provider.Id,
            Purpose = PaymentPurpose.BookingDeposit,
            Gateway = PaymentGatewayType.Stripe,
            GatewayReference = "pi_test_123",
            Amount = depositAmount,
            Currency = "usd",
            Status = PaymentStatus.Succeeded,
            CreatedAt = DateTime.UtcNow
        };

        db.ProviderProfiles.Add(provider);
        db.Services.Add(service);
        db.Wallets.Add(wallet);
        db.Bookings.Add(booking);
        db.Payments.Add(payment);
        db.SaveChangesAsync().GetAwaiter().GetResult();

        var currentUser = new FakeCurrentUserService { ProviderId = provider.Id, Role = AppRole.Provider };
        return (db, currentUser, provider, wallet, booking, payment);
    }

    [Fact]
    public async Task CompleteAsync_ReleasesDepositFromPendingToAvailableBalance()
    {
        var (db, currentUser, _, wallet, booking, _) = SeedConfirmedBookingWithDeposit(depositAmount: 40m);
        var gateways = Array.Empty<IPaymentGateway>();
        var sut = new BookingService(db, currentUser, gateways);

        var result = await sut.CompleteAsync(booking.Id);

        Assert.Equal(BookingStatus.Completed, result.Status);

        var reloadedWallet = await db.Wallets.FindAsync(wallet.Id);
        Assert.NotNull(reloadedWallet);
        Assert.Equal(0m, reloadedWallet!.PendingBalance);
        Assert.Equal(40m, reloadedWallet.AvailableBalance);

        var transaction = Assert.Single(db.WalletTransactions.Where(t => t.WalletId == wallet.Id).ToList());
        Assert.Equal(WalletTransactionType.DepositReleased, transaction.Type);
        Assert.Equal(40m, transaction.Amount);
        Assert.Equal(booking.Id, transaction.BookingId);
    }

    [Fact]
    public async Task CompleteAsync_FromNonConfirmedStatus_ThrowsConflict()
    {
        var (db, currentUser, _, _, booking, _) = SeedConfirmedBookingWithDeposit();
        booking.Status = BookingStatus.PendingPayment;
        await db.SaveChangesAsync();

        var sut = new BookingService(db, currentUser, Array.Empty<IPaymentGateway>());

        await Assert.ThrowsAsync<BookingSaas.Application.Common.Exceptions.ConflictException>(() => sut.CompleteAsync(booking.Id));
    }

    [Fact]
    public async Task CancelAsync_WithPaidDeposit_RefundsThroughGatewayAndReversesPendingBalance()
    {
        var (db, currentUser, _, wallet, booking, payment) = SeedConfirmedBookingWithDeposit(depositAmount: 40m);

        var stripeGateway = new Mock<IPaymentGateway>();
        stripeGateway.Setup(g => g.GatewayType).Returns(PaymentGatewayType.Stripe);
        stripeGateway
            .Setup(g => g.RefundAsync(It.Is<Payment>(p => p.Id == payment.Id), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RefundResult(true, "re_test_123"));

        var sut = new BookingService(db, currentUser, new[] { stripeGateway.Object });

        var result = await sut.CancelAsync(booking.Id);

        Assert.Equal(BookingStatus.Cancelled, result.Status);

        var reloadedPayment = await db.Payments.FindAsync(payment.Id);
        Assert.Equal(PaymentStatus.Refunded, reloadedPayment!.Status);

        var reloadedWallet = await db.Wallets.FindAsync(wallet.Id);
        Assert.Equal(0m, reloadedWallet!.PendingBalance);
        Assert.Equal(0m, reloadedWallet.AvailableBalance);

        var transaction = Assert.Single(db.WalletTransactions.Where(t => t.WalletId == wallet.Id).ToList());
        Assert.Equal(WalletTransactionType.Refund, transaction.Type);
        Assert.Equal(-40m, transaction.Amount);

        stripeGateway.Verify(g => g.RefundAsync(It.IsAny<Payment>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CancelAsync_WhenGatewayRefundFails_ThrowsAndLeavesBookingUnchanged()
    {
        var (db, currentUser, _, wallet, booking, payment) = SeedConfirmedBookingWithDeposit(depositAmount: 40m);

        var stripeGateway = new Mock<IPaymentGateway>();
        stripeGateway.Setup(g => g.GatewayType).Returns(PaymentGatewayType.Stripe);
        stripeGateway
            .Setup(g => g.RefundAsync(It.IsAny<Payment>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RefundResult(false, null, "card_declined"));

        var sut = new BookingService(db, currentUser, new[] { stripeGateway.Object });

        await Assert.ThrowsAsync<BookingSaas.Application.Common.Exceptions.ConflictException>(() => sut.CancelAsync(booking.Id));

        var reloadedBooking = await db.Bookings.FindAsync(booking.Id);
        Assert.Equal(BookingStatus.Confirmed, reloadedBooking!.Status);

        var reloadedWallet = await db.Wallets.FindAsync(wallet.Id);
        Assert.Equal(40m, reloadedWallet!.PendingBalance);
    }
}
