using BookingSaas.Application.Subscriptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingSaas.Api.Controllers;

[Route("api/subscriptions")]
[Authorize(Roles = "Provider")]
public class SubscriptionsController : ApiControllerBase
{
    private readonly SubscriptionService _subscriptionService;

    public SubscriptionsController(SubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    [HttpPost("checkout")]
    public async Task<ActionResult<SubscriptionCheckoutResponse>> Checkout([FromBody] SubscriptionCheckoutRequest request, CancellationToken ct)
    {
        await ValidateAsync(request, ct);
        return Ok(await _subscriptionService.CheckoutAsync(request, ct));
    }

    [HttpGet("me")]
    public async Task<ActionResult<SubscriptionDto>> Me(CancellationToken ct) =>
        Ok(await _subscriptionService.GetMeAsync(ct));
}
