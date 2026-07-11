using FluentValidation;

namespace BookingSaas.Application.Admin;

public class UpdatePlatformSettingsRequestValidator : AbstractValidator<UpdatePlatformSettingsRequest>
{
    public UpdatePlatformSettingsRequestValidator()
    {
        RuleFor(x => x.SubscriptionPriceUsd).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PayoutFeePercentage).InclusiveBetween(0, 100);
        RuleFor(x => x.PayoutFeeFixedUsd).GreaterThanOrEqualTo(0);
    }
}
