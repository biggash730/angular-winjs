using BookingSaas.Domain.Enums;

namespace BookingSaas.Domain.Entities;

public class PayoutRequest
{
    public Guid Id { get; set; }

    public Guid ProviderId { get; set; }
    public ProviderProfile? Provider { get; set; }

    public Guid WalletId { get; set; }
    public Wallet? Wallet { get; set; }

    /// <summary>Gross amount requested (debited from AvailableBalance).</summary>
    public decimal Amount { get; set; }

    /// <summary>Platform fee deducted (PayoutFeePercentage * Amount + PayoutFeeFixedUsd).</summary>
    public decimal FeeAmount { get; set; }

    /// <summary>Amount - FeeAmount; what actually gets sent to the provider.</summary>
    public decimal NetAmount { get; set; }

    public PayoutMethod Method { get; set; }

    /// <summary>Serialized bank account / mobile money destination details.</summary>
    public string DestinationJson { get; set; } = "{}";

    public PayoutStatus Status { get; set; } = PayoutStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }

    public ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
}
