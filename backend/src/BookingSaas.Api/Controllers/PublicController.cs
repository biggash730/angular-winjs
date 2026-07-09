using BookingSaas.Application.Availability;
using BookingSaas.Application.Bookings;
using BookingSaas.Application.Providers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingSaas.Api.Controllers;

[Route("api/public")]
[AllowAnonymous]
public class PublicController : ApiControllerBase
{
    private readonly ProviderService _providerService;
    private readonly AvailabilityService _availabilityService;
    private readonly BookingService _bookingService;

    public PublicController(ProviderService providerService, AvailabilityService availabilityService, BookingService bookingService)
    {
        _providerService = providerService;
        _availabilityService = availabilityService;
        _bookingService = bookingService;
    }

    [HttpGet("providers/{slug}")]
    public async Task<ActionResult<PublicProviderDto>> GetProvider(string slug, CancellationToken ct) =>
        Ok(await _providerService.GetPublicProviderAsync(slug, ct));

    [HttpGet("providers/{slug}/slots")]
    public async Task<ActionResult<IReadOnlyList<TimeSlotDto>>> GetSlots(string slug, [FromQuery] Guid serviceId, [FromQuery] DateOnly date, CancellationToken ct) =>
        Ok(await _availabilityService.GetPublicSlotsAsync(slug, serviceId, date, ct));

    [HttpPost("bookings")]
    public async Task<ActionResult<CreatePublicBookingResponse>> CreateBooking([FromBody] CreatePublicBookingRequest request, CancellationToken ct)
    {
        await ValidateAsync(request, ct);
        return Ok(await _bookingService.CreatePublicBookingAsync(request, ct));
    }

    [HttpGet("bookings/{id}")]
    public async Task<ActionResult<PublicBookingStatusDto>> GetBookingStatus(Guid id, CancellationToken ct) =>
        Ok(await _bookingService.GetPublicStatusAsync(id, ct));
}
