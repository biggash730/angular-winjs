using FluentValidation;

namespace BookingSaas.Application.Providers;

public class UpdateProviderProfileRequestValidator : AbstractValidator<UpdateProviderProfileRequest>
{
    public UpdateProviderProfileRequestValidator()
    {
        RuleFor(x => x.BusinessName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Category).IsInEnum();
        RuleFor(x => x.Bio).MaximumLength(2000);
        RuleFor(x => x.BrandColor).Matches("^#[0-9A-Fa-f]{6}$").When(x => !string.IsNullOrEmpty(x.BrandColor))
            .WithMessage("BrandColor must be a hex color, e.g. #4F46E5.");
        RuleFor(x => x.Timezone).NotEmpty();
        RuleFor(x => x.Phone).MaximumLength(30);
    }
}
