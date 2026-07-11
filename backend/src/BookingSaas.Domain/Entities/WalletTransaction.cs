using BookingSaas.Domain.Enums;

namespace BookingSaas.Domain.Entities;

public class WalletTransaction
{
    public Guid Id { get; set; }

    public Guid WalletId { get; set; }
    public Wallet? Wallet { get; set; }

    public WalletTransactionType Type { get; set; }
    public decimal Amount { get; set; }

    public Guid? BookingId { get; set; }
    public Booking? Booking { get; set; }

    public Guid? PayoutId { get; set; }
    public PayoutRequest? Payout { get; set; }

    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
