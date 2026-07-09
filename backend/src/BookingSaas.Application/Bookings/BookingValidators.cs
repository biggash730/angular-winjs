using FluentValidation;

namespace BookingSaas.Application.Bookings;

public class CreatePublicBookingRequestValidator : AbstractValidator<CreatePublicBookingRequest>
{
    public CreatePublicBookingRequestValidator()
    {
        RuleFor(x => x.Slug).NotEmpty();
        RuleFor(x => x.ServiceId).NotEmpty();
        RuleFor(x => x.ScheduledStart).GreaterThan(DateTime.UtcNow).WithMessage("ScheduledStart must be in the future.");
        RuleFor(x => x.ClientName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ClientEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.ClientPhone).MaximumLength(30);
        RuleFor(x => x.Notes).MaximumLength(1000);
        RuleFor(x => x.Gateway).IsInEnum();
    }
}
