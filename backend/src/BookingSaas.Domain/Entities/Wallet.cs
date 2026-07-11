namespace BookingSaas.Domain.Entities;

public class Wallet
{
    public Guid Id { get; set; }

    public Guid ProviderId { get; set; }
    public ProviderProfile? Provider { get; set; }

    public decimal AvailableBalance { get; set; }
    public decimal PendingBalance { get; set; }
    public string Currency { get; set; } = "usd";

    public ICollection<WalletTransaction> Transactions { get; set; } = new List<WalletTransaction>();
    public ICollection<PayoutRequest> PayoutRequests { get; set; } = new List<PayoutRequest>();
}
