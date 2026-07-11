namespace BookingSaas.Application.Common.Exceptions;

/// <summary>Requested entity does not exist. Mapped to HTTP 404 by the API's exception middleware.</summary>
public class NotFoundException : Exception
{
    public NotFoundException(string entity, object key) : base($"{entity} ({key}) was not found.") { }
    public NotFoundException(string message) : base(message) { }
}

/// <summary>Caller is authenticated but not allowed to perform the action. Mapped to HTTP 403.</summary>
public class ForbiddenException : Exception
{
    public ForbiddenException(string message = "You are not allowed to perform this action.") : base(message) { }
}

/// <summary>Request is well-formed but violates a business rule. Mapped to HTTP 409.</summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}

/// <summary>Generic bad request that isn't a FluentValidation failure. Mapped to HTTP 400.</summary>
public class BadRequestException : Exception
{
    public BadRequestException(string message) : base(message) { }
}
