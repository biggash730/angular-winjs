using BookingSaas.Application.Wallet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingSaas.Api.Controllers;

[Route("api/wallet")]
[Authorize(Roles = "Provider")]
public class WalletController : ApiControllerBase
{
    private readonly WalletService _walletService;

    public WalletController(WalletService walletService)
    {
        _walletService = walletService;
    }

    [HttpGet]
    public async Task<ActionResult<WalletDto>> GetWallet(CancellationToken ct) =>
        Ok(await _walletService.GetWalletAsync(ct));

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) =>
        Ok(await _walletService.GetTransactionsAsync(page, pageSize, ct));

    [HttpPost("payouts")]
    public async Task<ActionResult<PayoutRequestDto>> RequestPayout([FromBody] CreatePayoutRequest request, CancellationToken ct)
    {
        await ValidateAsync(request, ct);
        return Ok(await _walletService.RequestPayoutAsync(request, ct));
    }

    [HttpGet("payouts")]
    public async Task<IActionResult> ListPayouts([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) =>
        Ok(await _walletService.ListPayoutsAsync(page, pageSize, ct));
}
