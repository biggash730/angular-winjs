using BookingSaas.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingSaas.Api.Controllers;

[Route("api/services")]
[Authorize(Roles = "Provider")]
public class ServicesController : ApiControllerBase
{
    private readonly ServicesService _servicesService;

    public ServicesController(ServicesService servicesService)
    {
        _servicesService = servicesService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ServiceDto>>> List(CancellationToken ct) =>
        Ok(await _servicesService.ListAsync(ct));

    [HttpPost]
    public async Task<ActionResult<ServiceDto>> Create([FromBody] CreateServiceRequest request, CancellationToken ct)
    {
        await ValidateAsync(request, ct);
        var created = await _servicesService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(List), new { }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ServiceDto>> Update(Guid id, [FromBody] UpdateServiceRequest request, CancellationToken ct)
    {
        await ValidateAsync(request, ct);
        return Ok(await _servicesService.UpdateAsync(id, request, ct));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _servicesService.DeleteAsync(id, ct);
        return NoContent();
    }
}
