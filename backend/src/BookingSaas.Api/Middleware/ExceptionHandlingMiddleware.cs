using System.Net;
using System.Text.Json;
using BookingSaas.Application.Common.Exceptions;
using FluentValidation;

namespace BookingSaas.Api.Middleware;

/// <summary>Translates Application-layer exceptions into the right HTTP status + a small JSON
/// error envelope, so controllers can stay free of try/catch boilerplate.</summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleAsync(context, ex);
        }
    }

    private async Task HandleAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message, errors) = exception switch
        {
            ValidationException vex => (HttpStatusCode.BadRequest, "One or more validation errors occurred.",
                (object?)vex.Errors.GroupBy(e => e.PropertyName).ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray())),
            NotFoundException nf => (HttpStatusCode.NotFound, nf.Message, null),
            ForbiddenException fb => (HttpStatusCode.Forbidden, fb.Message, null),
            ConflictException cf => (HttpStatusCode.Conflict, cf.Message, null),
            BadRequestException br => (HttpStatusCode.BadRequest, br.Message, null),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred.", null)
        };

        if (statusCode == HttpStatusCode.InternalServerError)
            _logger.LogError(exception, "Unhandled exception processing {Method} {Path}", context.Request.Method, context.Request.Path);
        else
            _logger.LogWarning("{ExceptionType}: {Message}", exception.GetType().Name, exception.Message);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var payload = JsonSerializer.Serialize(new { message, errors }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        await context.Response.WriteAsync(payload);
    }
}
