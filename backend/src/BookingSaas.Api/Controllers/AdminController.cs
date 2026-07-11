using BookingSaas.Application.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingSaas.Api.Controllers;

[Route("api/admin")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminController : ApiControllerBase
{
    private readonly AdminService _adminService;

    public AdminController(AdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("dashboard/stats")]
    public async Task<ActionResult<AdminDashboardStatsDto>> DashboardStats(CancellationToken ct) =>
        Ok(await _adminService.GetDashboardStatsAsync(ct));

    [HttpGet("providers")]
    public async Task<IActionResult> ListProviders([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) =>
        Ok(await _adminService.ListProvidersAsync(page, pageSize, ct));

    [HttpGet("providers/{id}")]
    public async Task<ActionResult<AdminProviderDetailDto>> GetProvider(Guid id, CancellationToken ct) =>
        Ok(await _adminService.GetProviderAsync(id, ct));

    [HttpPost("providers/{id}/suspend")]
    public async Task<IActionResult> SuspendProvider(Guid id, CancellationToken ct)
    {
        await _adminService.SuspendProviderAsync(id, ct);
        return NoContent();
    }

    [HttpPost("providers/{id}/activate")]
    public async Task<IActionResult> ActivateProvider(Guid id, CancellationToken ct)
    {
        await _adminService.ActivateProviderAsync(id, ct);
        return NoContent();
    }

    [HttpGet("bookings")]
    public async Task<IActionResult> ListBookings([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) =>
        Ok(await _adminService.ListBookingsAsync(page, pageSize, ct));

    [HttpGet("payments")]
    public async Task<IActionResult> ListPayments([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) =>
        Ok(await _adminService.ListPaymentsAsync(page, pageSize, ct));

    [HttpGet("payouts")]
    public async Task<IActionResult> ListPayouts([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) =>
        Ok(await _adminService.ListPayoutsAsync(page, pageSize, ct));

    [HttpPost("payouts/{id}/approve")]
    public async Task<ActionResult<AdminPayoutDto>> ApprovePayout(Guid id, CancellationToken ct) =>
        Ok(await _adminService.ApprovePayoutAsync(id, ct));

    [HttpPost("payouts/{id}/reject")]
    public async Task<ActionResult<AdminPayoutDto>> RejectPayout(Guid id, CancellationToken ct) =>
        Ok(await _adminService.RejectPayoutAsync(id, ct));

    [HttpGet("subscriptions")]
    public async Task<IActionResult> ListSubscriptions([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) =>
        Ok(await _adminService.ListSubscriptionsAsync(page, pageSize, ct));

    [HttpGet("settings")]
    public async Task<ActionResult<PlatformSettingsDto>> GetSettings(CancellationToken ct) =>
        Ok(await _adminService.GetSettingsAsync(ct));

    [HttpPut("settings")]
    public async Task<ActionResult<PlatformSettingsDto>> UpdateSettings([FromBody] UpdatePlatformSettingsRequest request, CancellationToken ct)
    {
        await ValidateAsync(request, ct);
        return Ok(await _adminService.UpdateSettingsAsync(request, ct));
    }
}
