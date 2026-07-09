using BookingSaas.Application.Bookings;
using BookingSaas.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingSaas.Api.Controllers;

[Route("api/bookings")]
[Authorize(Roles = "Provider")]
public class BookingsController : ApiControllerBase
{
    private readonly BookingService _bookingService;

    public BookingsController(BookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] BookingStatus? status, [FromQuery] DateTime? from, [FromQuery] DateTime? to,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) =>
        Ok(await _bookingService.ListAsync(status, from, to, page, pageSize, ct));

    [HttpGet("{id}")]
    public async Task<ActionResult<BookingDto>> GetById(Guid id, CancellationToken ct) =>
        Ok(await _bookingService.GetByIdAsync(id, ct));

    [HttpPost("{id}/confirm")]
    public async Task<ActionResult<BookingDto>> Confirm(Guid id, CancellationToken ct) =>
        Ok(await _bookingService.ConfirmAsync(id, ct));

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<BookingDto>> Cancel(Guid id, CancellationToken ct) =>
        Ok(await _bookingService.CancelAsync(id, ct));

    [HttpPost("{id}/complete")]
    public async Task<ActionResult<BookingDto>> Complete(Guid id, CancellationToken ct) =>
        Ok(await _bookingService.CompleteAsync(id, ct));
}
