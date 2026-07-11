using FluentValidation;

namespace BookingSaas.Application.Wallet;

public class CreatePayoutRequestValidator : AbstractValidator<CreatePayoutRequest>
{
    public CreatePayoutRequestValidator()
    {
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Method).IsInEnum();
        RuleFor(x => x.Destination).NotNull();
        When(x => x.Method == Domain.Enums.PayoutMethod.BankTransfer, () =>
        {
            RuleFor(x => x.Destination.AccountNumber).NotEmpty().WithMessage("AccountNumber is required for bank transfer payouts.");
            RuleFor(x => x.Destination.AccountName).NotEmpty().WithMessage("AccountName is required for bank transfer payouts.");
            RuleFor(x => x.Destination.BankName).NotEmpty().WithMessage("BankName is required for bank transfer payouts.");
        });
        When(x => x.Method == Domain.Enums.PayoutMethod.MobileMoney, () =>
        {
            RuleFor(x => x.Destination.MobileNumber).NotEmpty().WithMessage("MobileNumber is required for mobile money payouts.");
            RuleFor(x => x.Destination.MobileNetwork).NotEmpty().WithMessage("MobileNetwork is required for mobile money payouts.");
        });
    }
}
