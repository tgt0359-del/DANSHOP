# Email architecture (Order Email Notification Foundation, real Resend integration added in PHASE 34)

This directory sends DANSHOP's real order-confirmation email. **The
integration code is real** (`providers/resendProvider.ts` makes a genuine
HTTP call to Resend's API) **but no real Resend account/API key exists in
this project's own `.env.local`**, so every send in this environment still
honestly resolves `{ status: "not_configured" }` — no real email has ever
been sent by this project. Adding real credentials (see "Configuring
Resend for real" below) is the entire remaining step to make it live; no
further code changes are needed.

See also `src/lib/orders/` (the order data layer this reads from) and
`src/lib/payments/README.md` (the sibling "architecture prepared, no real
provider connected" module this one deliberately mirrors in spirit).

## What exists today

- `emailTemplates.ts` — pure, side-effect-free template building:
  `OrderConfirmationEmailPayload`/`OrderConfirmationEmailItem` (the typed
  shape every email template builds from), `mapOrderToEmailPayload` (turns
  a real `Order` into that shape), `buildOrderConfirmationEmailSubject`
  (its headline varies with the order's real status — see
  `resolveHeadlineKey`: pending, payment received, or cancelled), and
  `buildOrderConfirmationEmail` (returns `{ subject, html, text }` — a full
  HTML email with inline-only styles, no Tailwind classes, no JavaScript,
  plus a plain-text fallback). Includes DANSHOP branding, the order
  reference/date, the customer's email address, order status, payment
  status, payment method, an itemized product list (name/quantity/unit
  price/line total), subtotal, discount (only when non-zero), total,
  currency-formatted amounts, "View Order"/"View Invoice" buttons, and a
  support note. Localizes via the app's own real
  `src/locales/{en,lo,th}/common.json` files — the exact same translated
  copy the website itself renders, read through a small local helper
  rather than `LanguageProvider`'s React context (this code runs
  server-side, outside any component tree).
- `types/email.ts` — the shared adapter vocabulary (mirrors
  `types/payment.ts`'s role for the payments module): `EmailProviderId`
  ("resend" | "smtp"), `EmailMessage` (what a provider's `send()` takes),
  `EmailSendResult` (`not_configured` | `queued` | `sent` | `failed`), and
  the `EmailProvider` interface (`id`, `isConfigured()`, `send()`).
- `providers/resendProvider.ts` — **genuinely implemented** (PHASE 34): a
  single `fetch` call to `https://api.resend.com/emails` (no `resend` SDK
  package added — Resend's API is one plain JSON POST). `isConfigured()`
  reports whether `RESEND_API_KEY` is set; `send()` resolves `sent` only on
  a real 2xx response with a message id, `failed` with a short reason code
  (`RESEND_HTTP_<status>`, `RESEND_INVALID_RESPONSE`,
  `RESEND_NETWORK_ERROR`) on anything else — never throws, never
  fabricates success.
- `providers/smtpProvider.ts` — **not implemented**. `isConfigured()` is
  real (reports whether `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD` are set),
  but `send()` still resolves `{status:"failed",
  reason:"PROVIDER_NOT_IMPLEMENTED"}` rather than throwing (an anticipated
  outcome, not an exceptional one) — mirrors
  `lib/payments/providers/bcelProvider.ts`'s identical "documented but not
  wired up" situation.
- `providers/providerRegistry.ts` — looks up a provider implementation by
  id (`getEmailProvider`), mirroring
  `lib/payments/providerRegistry.ts#getPaymentProvider`.
- `emailService.ts` — orchestration: `isEmailServiceConfigured()` (true
  only when `EMAIL_PROVIDER` names a real, registered adapter, `EMAIL_FROM`
  is set, AND that provider's own `isConfigured()` says it has its
  credentials — see `.env.example`), `sendOrderConfirmationEmail()`,
  `sendOrderInvoiceEmail()` (PHASE 34 — see its own comment: today this
  sends the exact same message as the confirmation email, since
  `buildOrderConfirmationEmail` already IS a full itemized invoice and no
  separate invoice route/content exists; kept as its own named, separately
  logged function so a future explicit "email my invoice" action has a
  clear entry point without duplicating logic — not called from anywhere
  yet, since no such action exists in the UI), and `sendPaymentStatusEmail()`.
  None of the three ever throws, ever blocks the caller, or ever claims a
  message was sent when it wasn't — all resolve `{ status: "not_configured" }`
  in this project's current environment, since no real `RESEND_API_KEY`/
  `EMAIL_PROVIDER`/`EMAIL_FROM` are set in `.env.local`.
- `emailDeliveryStatus.ts` — PHASE 34: `getEmailDeliveryStatus()`, a pure
  (no env/storage access) classifier mapping any raw `EmailSendResult`
  status (or a stored string, or `null`) into exactly the three states the
  UI ever shows: `"sent"` (covers `sent`/`queued`), `"not_configured"`
  (covers `not_configured` and "not yet known"), `"failed"`. The single
  place this mapping happens — usable from server code (right after a real
  send) or a client component (reading a stored status) — so every surface
  agrees on what a status means.
- `lastOrderEmailStatus.ts` — transient, this-tab-only storage (not part of
  the persisted `Order`) for the last order's real email-delivery outcome,
  written by `orderRepository.placeOrder` and read by `OrderSuccessView`
  (through `getEmailDeliveryStatus()`) so its status sentence is only ever
  one of the three genuinely-earned states.
- The one real call site: `src/app/api/orders/route.ts`, right after
  `create_order()` succeeds — see "The one real call site" below.
- `src/app/api/dev/email-preview/route.ts` — a development-only route
  (404s whenever `NODE_ENV === "production"`) that renders
  `buildOrderConfirmationEmail`'s real output against synthetic, clearly
  fake data (`?locale=`/`?status=`/`?format=` query params) — for visually
  checking the template without sending anything or touching a real order.

## What does NOT exist (by design)

- No SMTP/nodemailer or Supabase Edge Function integration.
- No real email has ever been sent by this app, in development or
  production — this project's own `.env.local` sets no real
  `RESEND_API_KEY`/`EMAIL_PROVIDER`/`EMAIL_FROM`, so
  `isEmailServiceConfigured()` returns `false` here regardless of the
  Resend integration being real code.
- No separate `/invoice` route — `OrderConfirmationEmailPayload.orderUrl`
  and `.invoiceUrl` are the same URL today (`/orders/[reference]`, UI-23's
  invoice-in-page). Kept as two distinct fields so a real, separate
  invoice URL can be introduced later without reshaping the payload or
  every template that reads it — and so `sendOrderInvoiceEmail` already has
  a distinct name ready for that day, even though it sends identical
  content to `sendOrderConfirmationEmail` right now.
- No `locale` column on `orders` (no Supabase schema change was made or is
  needed for this phase). The checkout visit's active language is instead
  passed through the existing `/api/orders` request body (an optional
  `locale` field, validated server-side against the three real locales and
  never forwarded to `create_order()`) purely so the one email for that
  order can be written in it — never persisted anywhere.
- No new API route for sending/resending an email given just an order
  reference. `sendOrderConfirmationEmail` already runs inside the one
  trusted route that creates the order (`/api/orders`), using that same
  request's server-validated `order`/`order.customer.email` — never a
  client-supplied reference or address — so there is no scenario where a
  client could trigger an email for someone else's order today. A future
  "resend"/"email me my invoice" UI action would need such a route (with
  its own order-reference validation, ownership check, and rate limiting);
  none exists today because no UI action calls for it yet.

## The one real call site

`src/app/api/orders/route.ts`'s `POST` handler calls
`sendOrderConfirmationEmail({ order, locale })` immediately after mapping a
successful `create_order()` result — but **only when that result is a
genuinely new order**, never on an idempotent replay (`create_order()`'s
own `replay: true`/`false` flag on its JSON result, from the Step 79
idempotency-key work — see that migration). This is what prevents a
duplicate confirmation email:

- A customer refreshing `/checkout/success` never re-calls this route at
  all — that page only reads the already-placed order from local storage
  (`useLastOrder`), so no new HTTP request, and no new email, is ever
  triggered by a refresh.
- A genuine retried "Place Order" click (a double-click, or a network
  retry after a dropped response) reuses the same per-visit
  `clientRequestId` (an opaque idempotency key generated once per checkout
  visit — see `OrderReviewView`) and gets back `replay: true` from
  `create_order()`, which this route recognizes and skips the email for.

The send is `await`ed (not fire-and-forget) so it actually runs to
completion within the request in a serverless environment, but it can
never fail the order-creation response — the whole call is wrapped in its
own `try`/`catch`, and `sendOrderConfirmationEmail` itself is designed to
never throw in the first place. A customer's order is exactly as real and
saved whether or not the email step succeeds.

## Logging discipline

Every log line uses `console.info`/`console.warn` (never `console.error`,
since "no provider configured" is this project's normal, expected state
today, not a fault) and includes only the order reference, a **masked**
customer email (e.g. `da***@example.com` — see `maskEmail`), the provider
id, and — on failure — a short reason code (e.g. `RESEND_HTTP_401`,
`MISSING_EMAIL`). Never logged, anywhere in this module: the full customer
email address, the rendered email subject/HTML/text body, the
`RESEND_API_KEY` (or any other credential), or any Resend API response
body. No password, OTP, card number, CVV, PIN, access token, or other
secret is ever read from an `Order` or an email payload to begin with —
none of those fields exist on those types.

## How the system behaves when the provider is not configured

`isEmailServiceConfigured()` requires ALL of: a real, registered
`EMAIL_PROVIDER` name, `EMAIL_FROM` set, and that provider's own
`isConfigured()` (e.g. Resend's checks `RESEND_API_KEY`). Missing any one
of these — including this project's own current `.env.local`, which sets
none of them — makes every send resolve `{ status: "not_configured" }`
immediately, before any network call is attempted:

- The order is created and saved exactly as normal — email delivery is
  never a precondition for a successful checkout.
- `/checkout/success` renders normally and shows the honest
  `checkout.emailConfirmationPending` sentence ("a confirmation email will
  be sent once email delivery is connected").
- In development, a `[Dev] Email delivery: not_configured` badge is also
  shown (never in a production build, never localized — a developer debug
  note, not customer-facing copy).
- Nothing here ever "pretends" an email was sent, queued, or even
  attempted.

## Duplicate-send handling

Two independent layers, neither of which needed a new column or table:

1. **`/checkout/success` never re-triggers the send.** It only reads the
   already-placed order from this browser's local order store
   (`useLastOrder`); visiting or refreshing it never issues a new
   `POST /api/orders` request.
2. **The idempotency key.** `OrderReviewView` generates one opaque
   `clientRequestId` per checkout visit and reuses it on every "Place
   Order" attempt during that visit. `create_order()` recognizes a repeat
   call with the same key as the same order (`replay: true`) instead of
   creating a second one, and `/api/orders/route.ts` only calls
   `sendOrderConfirmationEmail` when `replay` is `false` — so a
   double-click or a retried network request can never send a second
   email for the same order.

## The intended future flow

```
Place Order (OrderReviewView)
  → POST /api/orders                         (raw cart + client's current locale)
  → create_order() (Supabase RPC)            (real row created OR existing row replayed)
  → route reads `replay` on the RPC result
      replay = true  → skip email (already sent, or will be — same order)
      replay = false → sendOrderConfirmationEmail({ order, locale })
  → sendOrderConfirmationEmail
      not configured  → log + resolve (today's only real path in this env)
      configured      → build the message (emailTemplates.ts) → look up
                         the provider (providers/providerRegistry.ts) →
                         provider.send() (Resend: a real HTTP call;
                         SMTP: still a stub) → resolve sent/queued/failed
  → route always attaches the real `emailDeliveryStatus` word to its JSON
    response (never sensitive — just "sent"/"not_configured"/etc.)
  → order-creation response returns regardless of the email outcome
  → orderRepository.placeOrder stashes that status (lastOrderEmailStatus.ts)
  → OrderSuccessView classifies it via getEmailDeliveryStatus() and shows
    exactly one of three sentences — sent / not connected yet / failed —
    never a fabricated claim; a separate raw "[Dev] ..." label is
    additionally shown in development only
```

A future payment webhook (`src/app/api/payments/webhook/route.ts` — not
implemented, always responds 501) would be the real trigger for
`sendPaymentStatusEmail()`, once a genuine provider integration exists to
call `orderRepository.updatePaymentStatus` from. Nothing here invents that
trigger early.

## Required environment variables

All of these are **server-only** — read only inside `src/lib/email/` and
the one Route Handler that calls it (`src/app/api/orders/route.ts`). None
may ever be renamed with a `NEXT_PUBLIC_` prefix (that would bundle the
value into the browser's JS and expose it to every visitor), and none are
ever read from a "use client" component.

| Variable | Required for | Notes |
|---|---|---|
| `EMAIL_PROVIDER` | any real send | `resend` or `smtp` — which registered adapter to use. Empty = not configured. |
| `EMAIL_FROM` | any real send | The verified "from" address, e.g. `orders@yourdomain.com`. |
| `EMAIL_REPLY_TO` | optional | Where a customer's reply goes, if different from `EMAIL_FROM`. |
| `APP_URL` | usable links | This deployment's real canonical base URL (no trailing slash) — used to build the absolute "View Order"/"View Invoice" links; falls back to `http://localhost:3000` when unset, which only matters in development. |
| `RESEND_API_KEY` | `EMAIL_PROVIDER=resend` | Resend's own API key (starts `re_`). |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` | `EMAIL_PROVIDER=smtp` | Present in `.env.example` and checked by `smtpProvider.isConfigured()`, but `send()` itself is still unimplemented — see "What does NOT exist." |

### Where to configure them

- **Local development**: an untracked `.env.local` at the project root
  (already excluded by `.gitignore`) — copy the placeholder names from
  `.env.example`, never commit real values.
- **Production**: your hosting provider's own secret/environment-variable
  manager (e.g. Vercel Project Settings → Environment Variables) — never
  in a file committed to the repository.
- `.env.example` itself must only ever contain placeholder/empty values —
  it is committed as documentation of which names exist, not where real
  secrets live.

## Configuring Resend for real (when you're ready)

1. Create a Resend account and an API key at resend.com — copy the key
   (starts `re_`); it's shown once.
2. **Verify your sending domain** in the Resend dashboard (Domains → Add
   Domain): add the DNS records (SPF/DKIM, typically a `TXT` and a `CNAME`
   or two) Resend gives you, at your domain registrar/DNS provider. Wait
   for Resend to show the domain as verified — sending from an unverified
   domain is rejected or heavily rate-limited by most providers, Resend
   included.
3. Set, server-side only (`.env.local` for local testing, your host's
   secret manager for production):
   - `EMAIL_PROVIDER=resend`
   - `RESEND_API_KEY=<the real key from step 1>`
   - `EMAIL_FROM=<an address at the verified domain, e.g. orders@yourdomain.com>`
   - `APP_URL=<your real, canonical deployed domain>`
4. Restart the app (environment variables are read at process start).
   `isEmailServiceConfigured()` now returns `true`, and the next real order
   will call Resend's actual API and resolve a genuine `sent`/`failed`
   result — no further code change is needed anywhere in this app.

### How to test safely before going live

- Use the dev-only preview route (`/api/dev/email-preview?locale=en&status=pending`,
  or `&format=text`) to check the rendered subject/HTML/text of every
  locale × status combination — this never sends anything and never
  touches a real order (see that route's own file for details).
- Once real credentials are set, place a real test order using **your own
  email address** as the customer email (guest checkout needs no account)
  and confirm the resulting inbox message — never test against a real
  customer's address.
- Resend's own dashboard (Logs) shows every real send attempt, its status,
  and any bounce/delivery event — useful for confirming a test send
  actually arrived without needing to add anything to this codebase.
- Never commit a real `RESEND_API_KEY` (or any other credential) to the
  repository, in `.env.example`, in a commit message, or in a code
  comment — if one is ever pasted somewhere by mistake, rotate it in the
  Resend dashboard immediately.
