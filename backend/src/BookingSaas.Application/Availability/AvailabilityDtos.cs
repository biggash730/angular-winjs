namespace BookingSaas.Application.Availability;

public record WorkingHoursDto(Guid Id, DayOfWeek DayOfWeek, TimeSpan StartTime, TimeSpan EndTime, bool IsClosed);

public record WorkingHoursItemRequest(DayOfWeek DayOfWeek, TimeSpan StartTime, TimeSpan EndTime, bool IsClosed);

/// <summary>Full-week replace: PUT /availability body is the list of 7 day entries.</summary>
public record UpdateAvailabilityRequest(List<WorkingHoursItemRequest> Days);

public record TimeOffDto(Guid Id, DateTime StartAt, DateTime EndAt, string? Reason);

public record CreateTimeOffRequest(DateTime StartAt, DateTime EndAt, string? Reason);

public record TimeSlotDto(DateTime Start, DateTime End);
