using BookingSaas.Domain.Enums;

namespace BookingSaas.Application.Providers;

public record ProviderProfileDto(
    Guid Id,
    string BusinessName,
    string Slug,
    ProviderCategory Category,
    string? Bio,
    string? LogoUrl,
    string? CoverImageUrl,
    string? BrandColor,
    string? Address,
    string? Phone,
    string Timezone,
    bool IsActive);

public record UpdateProviderProfileRequest(
    string BusinessName,
    ProviderCategory Category,
    string? Bio,
    string? LogoUrl,
    string? CoverImageUrl,
    string? BrandColor,
    string? Address,
    string? Phone,
    string Timezone);

public record PublicServiceDto(Guid Id, string Name, string? Description, int DurationMinutes, decimal Price, int DepositPercentage);

public record PublicWorkingHoursDto(DayOfWeek DayOfWeek, string StartTime, string EndTime, bool IsClosed);

public record PublicProviderDto(
    Guid Id,
    string BusinessName,
    string Slug,
    ProviderCategory Category,
    string? Bio,
    string? LogoUrl,
    string? CoverImageUrl,
    string? BrandColor,
    string? Address,
    string? Phone,
    string Timezone,
    bool IsAcceptingBookings,
    IReadOnlyList<PublicServiceDto> Services,
    IReadOnlyList<PublicWorkingHoursDto> WorkingHours);
