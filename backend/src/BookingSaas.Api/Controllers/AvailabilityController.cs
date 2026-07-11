using BookingSaas.Application.Availability;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingSaas.Api.Controllers;

/// <summary>Covers both /availability (working hours) and /timeoff - they're two different
/// resource prefixes for the same "provider schedule" feature, per ARCHITECTURE.md's API
/// contract, so they share one controller with explicit per-action routes.</summary>
[Route("api")]
[Authorize(Roles = "Provider")]
public class AvailabilityController : ApiControllerBase
{
    private readonly AvailabilityService _availabilityService;

    public AvailabilityController(AvailabilityService availabilityService)
    {
        _availabilityService = availabilityService;
    }

    [HttpGet("availability")]
    public async Task<ActionResult<IReadOnlyList<WorkingHoursDto>>> GetAvailability(CancellationToken ct) =>
        Ok(await _availabilityService.GetAsync(ct));

    [HttpPut("availability")]
    public async Task<ActionResult<IReadOnlyList<WorkingHoursDto>>> UpdateAvailability([FromBody] UpdateAvailabilityRequest request, CancellationToken ct)
    {
        await ValidateAsync(request, ct);
        return Ok(await _availabilityService.UpdateAsync(request, ct));
    }

    [HttpGet("timeoff")]
    public async Task<ActionResult<IReadOnlyList<TimeOffDto>>> ListTimeOff(CancellationToken ct) =>
        Ok(await _availabilityService.ListTimeOffAsync(ct));

    [HttpPost("timeoff")]
    public async Task<ActionResult<TimeOffDto>> CreateTimeOff([FromBody] CreateTimeOffRequest request, CancellationToken ct)
    {
        await ValidateAsync(request, ct);
        var created = await _availabilityService.CreateTimeOffAsync(request, ct);
        return CreatedAtAction(nameof(ListTimeOff), new { }, created);
    }

    [HttpDelete("timeoff/{id}")]
    public async Task<IActionResult> DeleteTimeOff(Guid id, CancellationToken ct)
    {
        await _availabilityService.DeleteTimeOffAsync(id, ct);
        return NoContent();
    }
}
