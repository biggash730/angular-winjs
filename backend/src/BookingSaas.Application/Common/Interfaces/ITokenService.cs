using BookingSaas.Domain.Entities;

namespace BookingSaas.Application.Common.Interfaces;

public record TokenPair(string AccessToken, string RefreshToken);

public interface ITokenService
{
    /// <summary>Issues a short-lived JWT access token carrying sub/email/role/providerId claims.</summary>
    string GenerateAccessToken(AppUser user, Guid? providerId);

    /// <summary>
    /// Issues a long-lived, self-contained JWT refresh token (distinct "typ":"refresh" claim,
    /// Jwt:RefreshTokenDays expiry). v1 has no server-side refresh-token store (no such entity is
    /// defined in ARCHITECTURE.md's domain model), so refresh tokens are validated by signature +
    /// expiry only and cannot be individually revoked. See README "Design notes".
    /// </summary>
    string GenerateRefreshToken(AppUser user);

    /// <summary>Validates a refresh token and returns the embedded user id, or null if invalid/expired.</summary>
    Guid? ValidateRefreshToken(string refreshToken);
}
