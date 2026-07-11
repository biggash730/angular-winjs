using FluentValidation;

namespace BookingSaas.Application.Subscriptions;

public class SubscriptionCheckoutRequestValidator : AbstractValidator<SubscriptionCheckoutRequest>
{
    public SubscriptionCheckoutRequestValidator()
    {
        RuleFor(x => x.Gateway).IsInEnum();
    }
}
