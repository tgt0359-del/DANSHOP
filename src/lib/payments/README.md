# Payment architecture (Step 33, extended in Step 34)

This directory prepares DANSHOP's checkout for a real payment gateway.
**No real payment processing exists anywhere in this project.** Everything
here is typed scaffolding and a working demo stand-in, so a real provider
can be added later without rewriting checkout — not a live integration.

See also `src/lib/orders/` (Step 34) for the order data layer this
architecture updates: `Order` now carries its own `orderStatus` and
`paymentStatus` as two separate fields, and `orderRepository.ts` is the
service layer that creates/reads/updates orders — not this directory, but
the two are meant to stay compatible (see "The intended future flow" below).

## What exists today

- `src/types/payment.ts` — the shared vocabulary: `PaymentProvider`
  interface (`createPayment` / `getPaymentStatus` / `cancelPayment`),
  `PaymentStatus`, `PaymentSession`, `CreatePaymentRequest`/`Result`.
- `providers/manualProvider.ts` — the **only** provider actually wired up.
  A non-network stand-in that creates a `PENDING` session locally. This is
  what keeps today's demo checkout working end to end.
- `providers/bcelProvider.ts`, `providers/paypalProvider.ts` — **not
  implemented**. Every method throws a clear "not implemented" error. See
  "The BCEL rule" below for why.
- `providerRegistry.ts` — looks up a provider implementation by id.
- `paymentConfig.ts` — which providers are enabled (none but `manual`
  today) and which UI payment methods would route to which provider once
  configured.
- `paymentSessionStore.ts` — client-side, localStorage-backed bookkeeping
  for `PaymentSession` records, mirroring `lib/orders/orderStore.ts`'s
  pattern. Not called by the live checkout flow yet — see below.
- `mapPaymentStatusToOrderPaymentStatus.ts` — the one place a provider's
  `PaymentStatus` becomes DANSHOP's own `Order.paymentStatus` (kept
  separate from `Order.orderStatus` since Step 34 — see
  `src/types/order.ts`). Not called by the live checkout flow yet.
- `src/app/api/payments/webhook/route.ts` — a server-side route that
  exists as an integration boundary and currently always responds "not
  implemented." No payload is parsed or trusted.
- `src/app/checkout/payment/{success,cancel,failed}/page.tsx` — placeholder
  return-URL pages. Nothing currently redirects here; they exist so a real
  provider has somewhere to send the customer back to once wired up. None
  of them claim a payment outcome.

## What the live checkout flow actually does (unchanged in spirit since Step 32)

`Place Order` on `/checkout/review` calls `lib/orders/orderRepository.ts`'s
`createOrder()` (see Step 34), which creates an `Order` with
`orderStatus: "pending_payment"` and `paymentStatus: "pending"`, then
clears the cart once that record is saved. It does **not** call
`manualProvider`, the registry, or the session store. This step's payment
architecture exists alongside the working demo; wiring the two together
is future work, once there's a real provider worth wiring to.

## The intended future flow

```
Cart
  → Checkout (customer info)
  → Payment Method (choose a method)
  → Review Order
  → Create Order                     (orderRepository.createOrder — orderStatus: pending_payment, paymentStatus: pending)
  → Create Payment Session           (PaymentProvider.createPayment)
  → Redirect/Open Provider           (session.redirectUrl, a real provider's hosted page/app)
  → Provider Authentication          (handled entirely by the provider, off-site)
  → Provider Result                  (customer lands back on /checkout/payment/{success,cancel,failed})
  → Server Verification              (webhook and/or a server-side status check — never trust the client)
  → Update Order                     (mapPaymentStatusToOrderPaymentStatus → paymentStatus: "paid" only on verified confirmation; orderStatus updated separately via orderRepository.updateOrderStatus)
  → Success / Failed
```

The client-side return pages in step 6 above are **not** proof of payment
on their own — a customer can land on `/checkout/payment/success` from a
provider redirect, a bookmark, or a browser back button, so that page must
never itself flip an order to "paid." Only a verified server-side check
(the webhook, or a server-to-server status call using `getPaymentStatus`)
may do that.

## The BCEL rule

This project has no official BCEL merchant integration documentation and
no real merchant credentials. `bcelProvider.ts` therefore contains **no**
guessed endpoints, request/response shapes, authentication method, or
webhook payload — every method is a clearly marked `TODO(payments/bcel)`
that throws instead of fabricating a response. Implement it only once
that documentation and real credentials are available, and only by
reading the real docs at that time — not by extending the placeholder
types here as if they were confirmed facts about BCEL's actual API.

## Security

- No card number, CVV, PIN, OTP, or bank password field exists anywhere
  in this project, in any type, form, or storage.
- `paymentConfig.ts` only ever stores **env var names** (e.g.
  `"PAYMENT_API_KEY"`), never a secret value.
- See `.env.example` at the project root for the placeholder variable
  names a real integration would need — never `NEXT_PUBLIC_`-prefixed,
  since these are server-side secrets.
- `src/app/api/payments/webhook/route.ts` is a Next.js Route Handler,
  which only ever runs server-side — the correct place for a future
  signature-verification step, never client code.
