using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Application.Payments;
using BookingSaas.Domain.Entities;
using BookingSaas.Domain.Enums;
using BookingSaas.Tests.TestSupport;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace BookingSaas.Tests.Payments;

/// <summary>The other half of the deposit money-flow rule: a successful deposit webhook must
/// move the booking to Confirmed and credit Wallet.PendingBalance (WalletTransaction:
/// DepositHeld) - the balance that BookingServiceMoneyFlowTests later releases/refunds.</summary>
public class PaymentsServiceDepositHoldTests
{
    [Fact]
    public async Task HandleWebhookAsync_OnDepositSucceeded_ConfirmsBookingAndCreditsPendingBalance()
    {
        var db = TestDbContextFactory.Create();

        var provider = new ProviderProfile
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            BusinessName = "Jane's Studio",
            Slug = "janes-studio-2",
            Category = ProviderCategory.Hairdresser,
            Timezone = "UTC",
            IsActive = true
        };
        var wallet = new Domain.Entities.Wallet { Id = Guid.NewGuid(), ProviderId = provider.Id, Currency = "usd" };
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            ProviderId = provider.Id,
            ServiceId = Guid.NewGuid(),
            ClientName = "Alex",
            ClientEmail = "alex@example.com",
            ScheduledStart = DateTime.UtcNow.AddDays(1),
            ScheduledEnd = DateTime.UtcNow.AddDays(1).AddHours(1),
            ServicePrice = 100m,
            DepositAmount = 40m,
            DepositPaid = false,
            Status = BookingStatus.PendingPayment,
            CreatedAt = DateTime.UtcNow
        };
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            BookingId = booking.Id,
            ProviderId = provider.Id,
            Purpose = PaymentPurpose.BookingDeposit,
            Gateway = PaymentGatewayType.Stripe,
            GatewayReference = "pi_webhook_test",
            Amount = 40m,
            Currency = "usd",
            Status = PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        db.ProviderProfiles.Add(provider);
        db.Wallets.Add(wallet);
        db.Bookings.Add(booking);
        db.Payments.Add(payment);
        await db.SaveChangesAsync();

        var stripeGateway = new Mock<IPaymentGateway>();
        stripeGateway.Setup(g => g.GatewayType).Returns(PaymentGatewayType.Stripe);
        stripeGateway
            .Setup(g => g.ParseWebhookAsync(It.IsAny<string>(), It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new WebhookEvent(WebhookEventType.DepositSucceeded, "pi_webhook_test", booking.Id, provider.Id));

        var sut = new PaymentsService(db, new[] { stripeGateway.Object }, NullLogger<PaymentsService>.Instance);

        await sut.HandleWebhookAsync(PaymentGatewayType.Stripe, "{}", new Dictionary<string, string>());

        var reloadedBooking = await db.Bookings.FindAsync(booking.Id);
        Assert.Equal(BookingStatus.Confirmed, reloadedBooking!.Status);
        Assert.True(reloadedBooking.DepositPaid);

        var reloadedPayment = await db.Payments.FindAsync(payment.Id);
        Assert.Equal(PaymentStatus.Succeeded, reloadedPayment!.Status);

        var reloadedWallet = await db.Wallets.FindAsync(wallet.Id);
        Assert.Equal(40m, reloadedWallet!.PendingBalance);
        Assert.Equal(0m, reloadedWallet.AvailableBalance);

        var transaction = Assert.Single(db.WalletTransactions.Where(t => t.WalletId == wallet.Id).ToList());
        Assert.Equal(WalletTransactionType.DepositHeld, transaction.Type);
        Assert.Equal(40m, transaction.Amount);
    }
}
