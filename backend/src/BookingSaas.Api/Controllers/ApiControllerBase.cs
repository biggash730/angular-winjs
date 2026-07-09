using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace BookingSaas.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class ApiControllerBase : ControllerBase
{
    /// <summary>Runs the request through its registered FluentValidation validator (resolved via
    /// DI) and throws FluentValidation.ValidationException on failure, which
    /// ExceptionHandlingMiddleware turns into a 400 with a field->errors map.</summary>
    protected async Task ValidateAsync<T>(T request, CancellationToken ct = default)
    {
        var validator = HttpContext.RequestServices.GetService<IValidator<T>>();
        if (validator is null) return;

        var result = await validator.ValidateAsync(request, ct);
        if (!result.IsValid) throw new ValidationException(result.Errors);
    }
}
