using BookingSaas.Domain.Enums;

namespace BookingSaas.Application.Wallet;

public record WalletDto(Guid Id, decimal AvailableBalance, decimal PendingBalance, string Currency);

public record WalletTransactionDto(
    Guid Id,
    WalletTransactionType Type,
    decimal Amount,
    Guid? BookingId,
    Guid? PayoutId,
    string? Description,
    DateTime CreatedAt);

public record PayoutDestinationDto(string? BankName, string? AccountNumber, string? AccountName, string? MobileNetwork, string? MobileNumber);

public record CreatePayoutRequest(decimal Amount, PayoutMethod Method, PayoutDestinationDto Destination);

public record PayoutRequestDto(
    Guid Id,
    decimal Amount,
    decimal FeeAmount,
    decimal NetAmount,
    PayoutMethod Method,
    PayoutStatus Status,
    DateTime CreatedAt,
    DateTime? ProcessedAt);
