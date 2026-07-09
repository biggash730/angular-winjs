using BookingSaas.Domain.Enums;

namespace BookingSaas.Application.Auth;

public record RegisterRequest(string Email, string Password, string BusinessName, ProviderCategory Category);

public record LoginRequest(string Email, string Password);

public record RefreshRequest(string RefreshToken);

public record UserDto(Guid Id, string Email, AppRole Role, DateTime CreatedAt, Guid? ProviderId, string? ProviderSlug);

public record AuthResponse(string AccessToken, string RefreshToken, UserDto User);
