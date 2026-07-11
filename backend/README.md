# BookMe Backend

.NET 8 Web API (Clean Architecture) implementing the backend described in
`/ARCHITECTURE.md` at the repo root. That document is the source of truth for
the domain model, REST contract and money-flow rules; this README only covers
how to run this project and the handful of implementation decisions it made
where the spec left something unstated.

## Layout

```
BookingSaas.sln
src/BookingSaas.Domain          entities, enums - no project references
src/BookingSaas.Application     DTOs, interfaces, FluentValidation validators, business logic
src/BookingSaas.Infrastructure  EF Core (Npgsql), ASP.NET Identity, JWT, Stripe/Paystack gateways
src/BookingSaas.Api             controllers, Program.cs, Swagger, auth, CORS, Serilog
tests/BookingSaas.Tests         xUnit - money-flow unit tests (deposit hold/release, refund, payout fee)
docker-compose.yml              postgres + pgadmin for local dev
```

## Running locally

1. **Start Postgres** (and, optionally, pgadmin):

   ```bash
   cd backend
   docker compose up -d postgres
   # or: docker compose --profile tools up -d   (also starts pgadmin on http://localhost:5050)
   ```

   This matches the default connection string in `appsettings.Development.json`
   (`Host=localhost;Port=5432;Database=bookingsaas;Username=postgres;Password=postgres`).

2. **Apply the database migration**:

   ```bash
   cd backend
   dotnet ef database update --project src/BookingSaas.Infrastructure --startup-project src/BookingSaas.Api
   ```

3. **Run the API**:

   ```bash
   cd backend
   dotnet run --project src/BookingSaas.Api
   ```

   Swagger UI opens at `/swagger` in Development.

4. **Run the tests**:

   ```bash
   cd backend
   dotnet test
   ```

## Configuration / where to plug in real keys

All configuration is read from `appsettings.json` / `appsettings.Development.json`,
overridable by environment variables using the `Section__Key` double-underscore
convention (standard ASP.NET Core config binding), exactly as listed in
`ARCHITECTURE.md`:

```
ConnectionStrings__Default
Jwt__Secret / Jwt__Issuer / Jwt__Audience / Jwt__AccessTokenMinutes / Jwt__RefreshTokenDays
Stripe__SecretKey / Stripe__WebhookSecret / Stripe__PublishableKey / Stripe__SubscriptionPriceId
Paystack__SecretKey / Paystack__PublicKey
Frontend__WebAppUrl / Frontend__AdminAppUrl
```

The checked-in `appsettings*.json` files only contain placeholder values
(`sk_test_placeholder`, a dev-only JWT secret, etc.) - **never real secrets**.
For local development against real Stripe/Paystack test accounts, either:

- edit `appsettings.Development.json` directly (not committed to anything
  sensitive, but keep test keys out of source control in a real deployment), or
- use `dotnet user-secrets set Stripe:SecretKey sk_test_...` (the API project
  already has a `UserSecretsId`), or
- export the `Stripe__*` / `Paystack__*` / `Jwt__Secret` env vars before
  `dotnet run` (this is how a real deployment should supply them).

`Stripe__SubscriptionPriceId` must point to a real Stripe Price object
(recurring, $5.00/month) created in the Stripe Dashboard for the account
whose `Stripe__SecretKey` is configured. Paystack has no equivalent "price"
concept in its env vars - see "Design notes" below for how the Paystack
subscription plan is provisioned instead.

## Design notes

A few places in `ARCHITECTURE.md` left an implementation detail unstated, or
a domain-model constraint (fixed enum values, no extra entities) made the
"obvious" real-world choice unavailable. Simplest reasonable resolutions,
documented here so the frontend/admin teams and any future contributor can
see the reasoning:

- **`AppUser` doubles as the ASP.NET Core Identity user.** It inherits
  `IdentityUser<Guid>` directly in the Domain layer. This is the one
  deliberate exception to "Domain has no dependencies": it takes a single
  NuGet package reference (`Microsoft.Extensions.Identity.Core` - contracts
  and password hashing only, no EF Core, no ASP.NET hosting) and **no
  project references**, so "no project references out of Domain" still
  holds. This avoids maintaining a second, parallel user model just to
  satisfy a purity rule.
- **Role checks use the `AppUser.Role` enum + a JWT role claim**, not ASP.NET
  Identity's `IdentityRole` table (that table still exists, via
  `IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>`, because
  `UserManager`/`AddEntityFrameworkStores` expects it, but it's unused).
  `Role` is a fixed 4-value enum per the domain model table, so a full RBAC
  role store would be unused complexity.
- **`IApplicationDbContext`** (exposing `DbSet<T>` per entity plus
  `SaveChangesAsync`) is the repository + unit-of-work seam the task
  description leaves "as you see fit". `DbSet<T>` already gives
  query/add/remove, so this avoids ~13 hand-rolled repository interfaces
  that would just forward to EF Core anyway (the same pattern used by
  Jason Taylor's widely-used Clean Architecture template).
- **Refresh tokens are stateless, self-signed JWTs** (a second JWT with a
  `typ: refresh` claim and a longer expiry from `Jwt__RefreshTokenDays`),
  validated by signature + expiry only. `ARCHITECTURE.md`'s domain model
  table has no refresh-token entity, and adding one wasn't authorized, so
  there's no server-side revocation list in v1 - a leaked refresh token is
  valid until it expires. A production hardening pass would add a
  `RefreshToken` table with revocation.
- **`POST /public/bookings` gains an optional `gateway` field**
  (`"Stripe" | "Paystack"`, defaults to `Stripe` if omitted). The documented
  request body (`slug,serviceId,scheduledStart,clientName,clientEmail,clientPhone,notes`)
  has no way to say which payment gateway to use, yet the response must
  return a Stripe client secret *or* a Paystack access code, and "the client
  picks a gateway at checkout" per the tech-stack section. The `apps/web`
  frontend independently reached the same conclusion.
- **`GET /timeoff`** was added alongside the documented `POST /timeoff` and
  `DELETE /timeoff/{id}` - the dashboard needs to list existing time-off
  entries, and `apps/web` independently expects this route too.
- **Zero-deposit services** (`Service.DepositPercentage == 0`) skip payment
  entirely: `POST /public/bookings` confirms the booking immediately with no
  `Payment` row and an empty payment-init payload.
- **New providers start on a 14-day `Trialing` subscription** created at
  registration, so a brand-new storefront is live immediately without
  requiring a card up front. `ARCHITECTURE.md` doesn't specify a trial
  length; 14 days was picked as a reasonable default.
- **A failed deposit webhook (`DepositFailed`) auto-cancels the
  `PendingPayment` booking** so the time slot frees up for other clients,
  since a booking that never got its deposit paid shouldn't hold the slot.
- **Payout bookkeeping**: `POST /wallet/payouts` writes two
  `WalletTransaction` rows - `PayoutDebit` for `-NetAmount` (funds actually
  leaving to the bank/mobile-money account) and `PayoutFee` for
  `-FeeAmount` (fee retained by the platform) - which together remove the
  full gross `Amount` from `Wallet.AvailableBalance`. If an admin rejects a
  payout, or dispatch fails, both are reversed with positive-amount entries
  of the *same* `WalletTransactionType` values (no new enum member was
  added, since `WalletTransactionType`'s values are fixed by the domain
  model table).
- **`PayoutStatus` has no "Rejected" value** (fixed enum per the domain
  model table), so both an admin rejection and a failed dispatch attempt
  land on `Failed`.
- **`BookingStatus.NoShow`** is modeled (it's in the domain table) but no
  REST endpoint transitions a booking to it yet, because the API contract
  section only defines `confirm` / `cancel` / `complete`. Wiring up a
  `POST /bookings/{id}/no-show` endpoint later is straightforward.
- **`POST /bookings/{id}/confirm`** exists for cases where a booking needs
  manual confirmation without going through the deposit webhook - e.g.
  zero-deposit bookings, or a provider overriding a stuck payment. The
  normal deposit-paid path auto-confirms the booking from its Stripe/Paystack
  webhook handler.
- **Paystack subscriptions**: `ARCHITECTURE.md`'s env var list has no
  Paystack plan/price id (only `Paystack__SecretKey` / `Paystack__PublicKey`),
  unlike Stripe's `Stripe__SubscriptionPriceId`. `PaystackGateway` lazily
  looks up (or creates, on first use) a Paystack Plan named
  `"BookMe Standard Monthly"` via Paystack's `/plan` API, caches its
  `plan_code` in-process, and initializes a plan-linked transaction -
  Paystack auto-converts that into a running subscription after the first
  successful charge.
- **`POST /payments/stripe/webhook` and `POST /payments/paystack/webhook` are also unauthenticated** (`[AllowAnonymous]`), even though `ARCHITECTURE.md` says JWT auth applies to "everything except `/auth/*` and `/public/*`". Stripe/Paystack call these endpoints directly and can't present a user JWT; the security control there is gateway signature verification
  (`IPaymentGateway.ParseWebhookAsync` - HMAC/Stripe-Signature checks), not bearer auth. This is a necessary, narrow exception rather than a deviation from intent.
- **Refunds are treated as synchronous**: `BookingService.CancelAsync` calls
  the gateway's refund API inline and marks `Payment.Status = Refunded` as
  soon as the gateway call reports success. A hardened version would also
  listen for the refund-confirmed webhook before flipping that flag, but
  Stripe/Paystack refunds against a captured card payment essentially never
  fail after being accepted, so this is a reasonable v1 simplification.
- **The initial EF Core migration was hand-authored.** This build
  environment has no `dotnet` SDK available to run
  `dotnet ef migrations add`, so
  `src/BookingSaas.Infrastructure/Persistence/Migrations/20260101000000_InitialCreate.cs`
  was written by hand against the `IEntityTypeConfiguration<T>` classes in
  `Persistence/Configurations/`, and carefully cross-checked column-by-column.
  It does **not** include an EF-generated `ModelSnapshot.cs` (that's fine for
  `dotnet ef database update`, which just runs the migration's `Up()`
  method - it doesn't require a snapshot). It matters for *adding further
  migrations* later, though: the first time you do, run
  `dotnet ef migrations add <Name> --project src/BookingSaas.Infrastructure --startup-project src/BookingSaas.Api`
  and review the generated diff - if this file matches the live model
  exactly, the diff will be empty (aside from `ModelSnapshot.cs` itself
  being created); if not, the diff will show you precisely what to
  reconcile.

## Money flow summary (implementation pointers)

See `ARCHITECTURE.md` "Money flow" for the authoritative rules. In this
codebase:

- Deposit capture and release: `BookingService` (`CreatePublicBookingAsync`,
  `CompleteAsync`, `CancelAsync`) and `PaymentsService`
  (`HandleDepositSucceededAsync`/`HandleDepositFailedAsync`, driven by
  gateway webhooks) in `src/BookingSaas.Application`.
- Payout fee math: `PayoutFeeCalculator` (pure function, unit tested) plus
  `WalletService.RequestPayoutAsync` / `AdminService` (approve/reject) for
  the wallet bookkeeping around it.
- Subscription lifecycle: `SubscriptionService` + `PaymentsService`'s
  `HandleSubscriptionStatusAsync`.
