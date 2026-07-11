namespace BookingSaas.Application.Services;

public record ServiceDto(Guid Id, string Name, string? Description, int DurationMinutes, decimal Price, int DepositPercentage, bool IsActive);

public record CreateServiceRequest(string Name, string? Description, int DurationMinutes, decimal Price, int DepositPercentage);

public record UpdateServiceRequest(string Name, string? Description, int DurationMinutes, decimal Price, int DepositPercentage, bool IsActive);
