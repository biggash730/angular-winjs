using FluentValidation;

namespace BookingSaas.Application.Availability;

public class WorkingHoursItemRequestValidator : AbstractValidator<WorkingHoursItemRequest>
{
    public WorkingHoursItemRequestValidator()
    {
        RuleFor(x => x.DayOfWeek).IsInEnum();
        RuleFor(x => x.EndTime).GreaterThan(x => x.StartTime).When(x => !x.IsClosed)
            .WithMessage("EndTime must be after StartTime.");
    }
}

public class UpdateAvailabilityRequestValidator : AbstractValidator<UpdateAvailabilityRequest>
{
    public UpdateAvailabilityRequestValidator()
    {
        RuleFor(x => x.Days).NotEmpty();
        RuleForEach(x => x.Days).SetValidator(new WorkingHoursItemRequestValidator());
    }
}

public class CreateTimeOffRequestValidator : AbstractValidator<CreateTimeOffRequest>
{
    public CreateTimeOffRequestValidator()
    {
        RuleFor(x => x.EndAt).GreaterThan(x => x.StartAt);
        RuleFor(x => x.Reason).MaximumLength(500);
    }
}
