using BookingSaas.Application.Providers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingSaas.Api.Controllers;

[Route("api/providers")]
[Authorize(Roles = "Provider")]
public class ProvidersController : ApiControllerBase
{
    private readonly ProviderService _providerService;

    public ProvidersController(ProviderService providerService)
    {
        _providerService = providerService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<ProviderProfileDto>> GetMe(CancellationToken ct) =>
        Ok(await _providerService.GetMeAsync(ct));

    [HttpPut("me")]
    public async Task<ActionResult<ProviderProfileDto>> UpdateMe([FromBody] UpdateProviderProfileRequest request, CancellationToken ct)
    {
        await ValidateAsync(request, ct);
        return Ok(await _providerService.UpdateMeAsync(request, ct));
    }
}
