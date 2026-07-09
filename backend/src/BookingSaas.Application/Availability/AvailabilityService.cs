using BookingSaas.Application.Common.Exceptions;
using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Domain.Entities;
using BookingSaas.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BookingSaas.Application.Availability;

public class AvailabilityService
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public AvailabilityService(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<WorkingHoursDto>> GetAsync(CancellationToken ct = default)
    {
        _currentUser.EnsureProvider();
        var providerId = _currentUser.ProviderId!.Value;
        return await _db.WorkingHours
            .Where(w => w.ProviderId == providerId)
            .OrderBy(w => w.DayOfWeek)
            .Select(w => new WorkingHoursDto(w.Id, w.DayOfWeek, w.StartTime, w.EndTime, w.IsClosed))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<WorkingHoursDto>> UpdateAsync(UpdateAvailabilityRequest request, CancellationToken ct = default)
    {
        _currentUser.EnsureProvider();
        var providerId = _currentUser.ProviderId!.Value;

        var existing = await _db.WorkingHours.Where(w => w.ProviderId == providerId).ToListAsync(ct);
        _db.WorkingHours.RemoveRange(existing);

        var created = request.Days.Select(d => new WorkingHours
        {
            Id = Guid.NewGuid(),
            ProviderId = providerId,
            DayOfWeek = d.DayOfWeek,
            StartTime = d.StartTime,
            EndTime = d.EndTime,
            IsClosed = d.IsClosed
        }).ToList();

        _db.WorkingHours.AddRange(created);
        await _db.SaveChangesAsync(ct);

        return created.Select(w => new WorkingHoursDto(w.Id, w.DayOfWeek, w.StartTime, w.EndTime, w.IsClosed)).ToList();
    }

    public async Task<TimeOffDto> CreateTimeOffAsync(CreateTimeOffRequest request, CancellationToken ct = default)
    {
        _currentUser.EnsureProvider();
        var providerId = _currentUser.ProviderId!.Value;

        var timeOff = new TimeOff
        {
            Id = Guid.NewGuid(),
            ProviderId = providerId,
            StartAt = request.StartAt,
            EndAt = request.EndAt,
            Reason = request.Reason
        };
        _db.TimeOffs.Add(timeOff);
        await _db.SaveChangesAsync(ct);
        return new TimeOffDto(timeOff.Id, timeOff.StartAt, timeOff.EndAt, timeOff.Reason);
    }

    public async Task DeleteTimeOffAsync(Guid id, CancellationToken ct = default)
    {
        _currentUser.EnsureProvider();
        var providerId = _currentUser.ProviderId!.Value;

        var timeOff = await _db.TimeOffs.FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new NotFoundException("TimeOff", id);
        if (timeOff.ProviderId != providerId)
            throw new ForbiddenException("This time-off entry does not belong to your account.");

        _db.TimeOffs.Remove(timeOff);
        await _db.SaveChangesAsync(ct);
    }

    /// <summary>Open slots for a given service/date: working hours for that weekday, minus time
    /// off, minus existing PendingPayment/Confirmed bookings, sliced into back-to-back blocks the
    /// length of the service duration.</summary>
    public async Task<IReadOnlyList<TimeSlotDto>> GetPublicSlotsAsync(string slug, Guid serviceId, DateOnly date, CancellationToken ct = default)
    {
        var provider = await _db.ProviderProfiles.FirstOrDefaultAsync(p => p.Slug == slug, ct)
            ?? throw new NotFoundException("Provider", slug);

        var service = await _db.Services.FirstOrDefaultAsync(s => s.Id == serviceId && s.ProviderId == provider.Id && s.IsActive, ct)
            ?? throw new NotFoundException("Service", serviceId);

        if (!provider.IsActive)
            return Array.Empty<TimeSlotDto>();

        var dayOfWeek = date.DayOfWeek;
        var workingHours = await _db.WorkingHours
            .FirstOrDefaultAsync(w => w.ProviderId == provider.Id && w.DayOfWeek == dayOfWeek, ct);

        if (workingHours is null || workingHours.IsClosed)
            return Array.Empty<TimeSlotDto>();

        var dayStart = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var dayEnd = dayStart.AddDays(1);

        var timeOffs = await _db.TimeOffs
            .Where(t => t.ProviderId == provider.Id && t.StartAt < dayEnd && t.EndAt > dayStart)
            .ToListAsync(ct);

        var busyBookings = await _db.Bookings
            .Where(b => b.ProviderId == provider.Id
                        && (b.Status == BookingStatus.PendingPayment || b.Status == BookingStatus.Confirmed)
                        && b.ScheduledStart < dayEnd && b.ScheduledEnd > dayStart)
            .Select(b => new { b.ScheduledStart, b.ScheduledEnd })
            .ToListAsync(ct);

        var duration = TimeSpan.FromMinutes(service.DurationMinutes);
        var windowStart = dayStart.Add(workingHours.StartTime);
        var windowEnd = dayStart.Add(workingHours.EndTime);

        var slots = new List<TimeSlotDto>();
        var now = DateTime.UtcNow;
        for (var start = windowStart; start.Add(duration) <= windowEnd; start = start.Add(duration))
        {
            var end = start.Add(duration);
            if (start < now) continue;

            var overlapsTimeOff = timeOffs.Any(t => start < t.EndAt && end > t.StartAt);
            var overlapsBooking = busyBookings.Any(b => start < b.ScheduledEnd && end > b.ScheduledStart);
            if (!overlapsTimeOff && !overlapsBooking)
                slots.Add(new TimeSlotDto(start, end));
        }

        return slots;
    }
}
