# BookMe — Service Provider Booking SaaS

Platform for independent service providers (barbers, hairdressers, makeup
artists, specialist clinics, photographers, car rentals, and any bookable
service business) to sell appointments online through a personal booking
page, and for the platform operator to manage providers, subscriptions and
payouts.

This document is the single source of truth for the data model, API
contract and repo layout. All three build-outs (backend, provider/client
web app, admin web app) must conform to it exactly so the pieces integrate
without further reconciliation.

## Monorepo layout

```
/backend                 .NET 8 Web API + PostgreSQL (Clean Architecture)
  BookingSaas.sln
  src/BookingSaas.Domain          entities, enums, value objects (no deps)
  src/BookingSaas.Application     DTOs, interfaces, use-case services, validation
  src/BookingSaas.Infrastructure  EF Core, Npgsql, Stripe/Paystack clients, repos
  src/BookingSaas.Api             controllers, Program.cs, auth, Swagger, DI wiring
  tests/BookingSaas.Tests         xUnit
  docker-compose.yml              postgres (+ pgadmin) for local dev

/apps/web                 React 18 + Vite + TS + Tailwind
                           -> provider dashboard + public client storefront/booking
/apps/admin                React 18 + Vite + TS + Tailwind
                           -> platform management app
```

Existing files at the repo root (the legacy `angular-winjs` sample) are
unrelated to this product and are left untouched.

## Tech stack

- **Backend**: ASP.NET Core 8 Web API, EF Core + Npgsql, ASP.NET Core
  Identity (custom `AppUser`) + JWT bearer auth, FluentValidation,
  Stripe.net, Paystack REST client, Serilog, Swagger/OpenAPI.
- **Frontend (both apps)**: React 18, TypeScript, Vite, Tailwind CSS,
  React Router v6, TanStack Query, Zustand (auth/session store), React
  Hook Form + Zod, `@stripe/stripe-js` + `@stripe/react-stripe-js`
  (covers card, Apple Pay, Google Pay via the Payment Request Button),
  `react-paystack`, lucide-react icons, Framer Motion, Recharts (admin
  charts).
- **Payments**: Stripe (cards, Apple Pay, Google Pay, subscriptions) and
  Paystack (cards, mobile money, bank transfer — Africa-focused) are both
  wired in behind a common `IPaymentGateway` abstraction. The client
  picks a gateway at checkout.

## Domain model

| Entity | Key fields |
|---|---|
| `AppUser` | Id, Email, PasswordHash, Role (`Provider`, `Client`, `Admin`, `SuperAdmin`), CreatedAt |
| `ProviderProfile` | Id, UserId, BusinessName, **Slug** (unique, e.g. `jane-hair-studio`), Category (`Barber`, `Hairdresser`, `MakeupArtist`, `Clinic`, `Photographer`, `CarRental`, `Other`), Bio, LogoUrl, CoverImageUrl, BrandColor, Address, Phone, Timezone, IsActive |
| `SubscriptionPlan` | Id, Name (`Standard`), PriceUsd (5.00), Interval (`Monthly`) — seeded, single plan for v1 |
| `ProviderSubscription` | Id, ProviderId, Gateway, GatewaySubscriptionId, Status (`Trialing`,`Active`,`PastDue`,`Canceled`), CurrentPeriodEnd |
| `Service` | Id, ProviderId, Name, Description, DurationMinutes, Price, DepositPercentage (0–100), IsActive |
| `WorkingHours` | Id, ProviderId, DayOfWeek, StartTime, EndTime, IsClosed |
| `TimeOff` | Id, ProviderId, StartAt, EndAt, Reason |
| `Booking` | Id, ProviderId, ServiceId, ClientName, ClientEmail, ClientPhone, ScheduledStart, ScheduledEnd, Status (`PendingPayment`,`Confirmed`,`Cancelled`,`Completed`,`NoShow`), ServicePrice, DepositAmount, DepositPaid, Notes, CreatedAt |
| `Payment` | Id, BookingId?, ProviderId?, Purpose (`BookingDeposit`,`Subscription`,`Payout`), Gateway (`Stripe`,`Paystack`), GatewayReference, Amount, Currency, Status (`Pending`,`Succeeded`,`Failed`,`Refunded`), CreatedAt |
| `Wallet` | Id, ProviderId, AvailableBalance, PendingBalance, Currency |
| `WalletTransaction` | Id, WalletId, Type (`DepositHeld`,`DepositReleased`,`Refund`,`PayoutDebit`,`PayoutFee`), Amount, BookingId?, PayoutId?, Description, CreatedAt |
| `PayoutRequest` | Id, ProviderId, Amount, FeeAmount, NetAmount, Method (`BankTransfer`,`MobileMoney`), DestinationJson, Status (`Pending`,`Processing`,`Completed`,`Failed`), CreatedAt, ProcessedAt |
| `PlatformSettings` | Id (singleton), SubscriptionPriceUsd, PayoutFeePercentage, PayoutFeeFixedUsd |

### Money flow

1. Client books a service on a provider's public page and pays the
   provider-configured **deposit percentage** of the service price
   up front (Stripe or Paystack). This creates a `Payment` and marks the
   `Booking` `PendingPayment` → `Confirmed`, and credits the provider's
   `Wallet.PendingBalance`.
2. Provider works the appointment, then marks it `Completed` (or
   `Cancelled`/`NoShow`).
   - `Completed` → the held amount moves `PendingBalance` →
     `AvailableBalance` (`WalletTransaction: DepositReleased`).
   - `Cancelled` before the appointment → deposit is refunded through the
     original gateway (`WalletTransaction: Refund`, `Payment.Status =
     Refunded`).
3. Provider requests a **payout** from `AvailableBalance` to a bank
   account or mobile-money wallet. Platform fee
   (`PlatformSettings.PayoutFeePercentage` + `PayoutFeeFixedUsd`, default
   2% + $0.30) is deducted; `NetAmount` is what actually gets sent.
   Payouts are queued `Pending` and settled by an admin/ops action in v1
   (`Processing` → `Completed`), stubbed behind `IPayoutProvider` so a
   real disbursement API can be dropped in later.
4. Providers pay the **flat $5/month subscription** via Stripe Billing
   (or Paystack subscription) to keep their booking page live. Lapsed
   subscription ⇒ public page shows "temporarily unavailable".

### Custom link

`https://<web-app-domain>/book/{slug}` — `slug` is derived from
`BusinessName` on signup (kebab-case, uniqueness enforced with a numeric
suffix on collision), editable later from the dashboard.

## REST API contract

Base path `/api`. JWT bearer auth on everything except `/auth/*` and
`/public/*`. Admin-only routes require Role `Admin`/`SuperAdmin`.

**Auth**
- `POST /auth/register` `{email,password,businessName,category}` → provider signup, creates `AppUser`+`ProviderProfile`+`Wallet`, returns tokens
- `POST /auth/login` `{email,password}` → `{accessToken, refreshToken, user}`
- `POST /auth/refresh` `{refreshToken}`
- `GET /auth/me`

**Provider profile**
- `GET /providers/me` / `PUT /providers/me`
- `GET /public/providers/{slug}` — public storefront payload (profile + services + working hours)

**Services**
- `GET /services` / `POST /services` / `PUT /services/{id}` / `DELETE /services/{id}`

**Availability**
- `GET /availability` / `PUT /availability` (working hours)
- `POST /timeoff` / `DELETE /timeoff/{id}`
- `GET /public/providers/{slug}/slots?serviceId=&date=` → open time slots for that day

**Bookings**
- `POST /public/bookings` `{slug,serviceId,scheduledStart,clientName,clientEmail,clientPhone,notes}` → creates `PendingPayment` booking + returns a payment init payload (Stripe PaymentIntent client secret or Paystack access code) for the deposit
- `GET /public/bookings/{id}` — client-facing status lookup
- `GET /bookings?status=&from=&to=` (provider)
- `GET /bookings/{id}`
- `POST /bookings/{id}/confirm`
- `POST /bookings/{id}/cancel`
- `POST /bookings/{id}/complete`

**Payments**
- `POST /payments/stripe/webhook`
- `POST /payments/paystack/webhook`
- `POST /subscriptions/checkout` `{gateway}` → Stripe Checkout URL or Paystack init
- `GET /subscriptions/me`

**Wallet**
- `GET /wallet`
- `GET /wallet/transactions`
- `POST /wallet/payouts` `{amount,method,destination}`
- `GET /wallet/payouts`

**Admin**
- `GET /admin/dashboard/stats`
- `GET /admin/providers` / `GET /admin/providers/{id}` / `POST /admin/providers/{id}/suspend` / `POST /admin/providers/{id}/activate`
- `GET /admin/bookings`
- `GET /admin/payments`
- `GET /admin/payouts` / `POST /admin/payouts/{id}/approve` / `POST /admin/payouts/{id}/reject`
- `GET /admin/subscriptions`
- `GET /admin/settings` / `PUT /admin/settings`

All list endpoints are paginated: `?page=1&pageSize=20` →
`{items, page, pageSize, total}`.

## Environment variables (backend)

```
ConnectionStrings__Default=Host=localhost;Database=bookingsaas;Username=postgres;Password=postgres
Jwt__Secret / Jwt__Issuer / Jwt__Audience / Jwt__AccessTokenMinutes / Jwt__RefreshTokenDays
Stripe__SecretKey / Stripe__WebhookSecret / Stripe__PublishableKey / Stripe__SubscriptionPriceId
Paystack__SecretKey / Paystack__PublicKey
Frontend__WebAppUrl / Frontend__AdminAppUrl
```

## Environment variables (frontend, `.env`)

```
VITE_API_BASE_URL
VITE_STRIPE_PUBLISHABLE_KEY
VITE_PAYSTACK_PUBLIC_KEY
```
