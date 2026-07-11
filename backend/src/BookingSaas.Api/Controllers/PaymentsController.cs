using BookingSaas.Application.Payments;
using BookingSaas.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingSaas.Api.Controllers;

[Route("api/payments")]
[AllowAnonymous]
public class PaymentsController : ApiControllerBase
{
    private readonly PaymentsService _paymentsService;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(PaymentsService paymentsService, ILogger<PaymentsController> logger)
    {
        _paymentsService = paymentsService;
        _logger = logger;
    }

    [HttpPost("stripe/webhook")]
    public Task<IActionResult> StripeWebhook(CancellationToken ct) => HandleWebhookAsync(PaymentGatewayType.Stripe, ct);

    [HttpPost("paystack/webhook")]
    public Task<IActionResult> PaystackWebhook(CancellationToken ct) => HandleWebhookAsync(PaymentGatewayType.Paystack, ct);

    private async Task<IActionResult> HandleWebhookAsync(PaymentGatewayType gateway, CancellationToken ct)
    {
        Request.EnableBuffering();
        using var reader = new StreamReader(Request.Body, leaveOpen: true);
        var rawBody = await reader.ReadToEndAsync(ct);
        Request.Body.Position = 0;

        var headers = Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString(), StringComparer.OrdinalIgnoreCase);

        await _paymentsService.HandleWebhookAsync(gateway, rawBody, headers, ct);
        return Ok();
    }
}
