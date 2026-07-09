namespace BookingSaas.Domain.Enums;

public enum AppRole
{
    Provider,
    Client,
    Admin,
    SuperAdmin
}

public enum ProviderCategory
{
    Barber,
    Hairdresser,
    MakeupArtist,
    Clinic,
    Photographer,
    CarRental,
    Other
}

public enum SubscriptionInterval
{
    Monthly
}

public enum PaymentGatewayType
{
    Stripe,
    Paystack
}

public enum SubscriptionStatus
{
    Trialing,
    Active,
    PastDue,
    Canceled
}

public enum BookingStatus
{
    PendingPayment,
    Confirmed,
    Cancelled,
    Completed,
    NoShow
}

public enum PaymentPurpose
{
    BookingDeposit,
    Subscription,
    Payout
}

public enum PaymentStatus
{
    Pending,
    Succeeded,
    Failed,
    Refunded
}

public enum WalletTransactionType
{
    DepositHeld,
    DepositReleased,
    Refund,
    PayoutDebit,
    PayoutFee
}

public enum PayoutMethod
{
    BankTransfer,
    MobileMoney
}

public enum PayoutStatus
{
    Pending,
    Processing,
    Completed,
    Failed
}
