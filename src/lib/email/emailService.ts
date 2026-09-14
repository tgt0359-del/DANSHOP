import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";
import {
  buildOrderConfirmationEmail,
  mapOrderToEmailPayload,
  type OrderConfirmationEmailPayload,
} from "@/lib/email/emailTemplates";
import { getEmailProvider } from "@/lib/email/providers/providerRegistry";
import type { EmailSendResult } from "@/types/email";
import type { Order } from "@/types/order";

/**
 * Order-email service — orchestration only (building the message lives in
 * `emailTemplates.ts`; picking/calling a provider lives in
 * `providers/providerRegistry.ts` + the provider adapters; this file
 * decides WHETHER to send and glues the two together). Server-only: a real
 * provider's API key must live in a plain, non-`NEXT_PUBLIC_`-prefixed
 * environment variable read only here (or inside a provider adapter
 * itself, e.g. `providers/resendProvider.ts`), mirroring the exact rule
 * `lib/supabase/config.ts` already documents for Supabase's own
 * service-role key. Never import this from a "use client" component — see
 * `src/lib/email/README.md` for the full architecture and the one real
 * call site today (`src/app/api/orders/route.ts`).
 *
 * PHASE 34 (Real Order Email Notification Foundation): `resendProvider.ts`
 * is now a genuine, working integration (a real `fetch` call to Resend's
 * API) — but this project's own `.env.local` still sets no real
 * `RESEND_API_KEY`/`EMAIL_PROVIDER`/`EMAIL_FROM`, so every real send in
 * THIS environment still resolves `{ status: "not_configured" }`, exactly
 * as honestly as before. `sendOrderConfirmationEmail`/
 * `sendOrderInvoiceEmail`/`sendPaymentStatusEmail` never fabricate
 * success — every customer-facing render of a result (`OrderSuccessView`,
 * via `getEmailDeliveryStatus` in `emailDeliveryStatus.ts`) shows one of
 * exactly three honest states: sent, not configured, or failed.
 */

export type { EmailSendResult } from "@/types/email";

export interface OrderConfirmationEmailInput {
  order: Order;
  /** The checkout visit's active language ("ตามภาษาของ order หรือ user").
   * `Order` itself carries no locale field (adding one would be a Supabase
   * schema change this phase doesn't need — see this project's own "don't
   * change the schema unless necessary" rule): the caller (the
   * /api/orders Route Handler) reads the client's current `useLanguage()`
   * locale at the moment "Place Order" is clicked and passes it straight
   * through here, used only to pick which already-translated copy this
   * one email is written in — never persisted. Falls back to
   * `defaultLocale` ("lo") when omitted or not a real locale. */
  locale?: string;
}

export interface PaymentStatusEmailInput {
  order: Order;
  locale?: string;
}

/**
 * Which email provider (if any) is configured, from a plain, server-only
 * `EMAIL_PROVIDER` environment variable — see `.env.example`. No value is
 * set in this project's own `.env.local` today, so this always resolves
 * `null` in this environment; that file is never read or modified by this
 * phase's own work.
 */
function getConfiguredProviderName(): string | null {
  const provider = process.env.EMAIL_PROVIDER?.trim();
  return provider ? provider : null;
}

/**
 * Whether a real email provider is ready to actually send mail: the
 * configured `EMAIL_PROVIDER` must name a real, registered adapter
 * (`providers/providerRegistry.ts`), a sender address (`EMAIL_FROM`) must
 * be set, AND that specific provider must report itself ready
 * (`provider.isConfigured()` — e.g. Resend needs `RESEND_API_KEY`, SMTP
 * needs its host/user/password) — matching
 * `lib/supabase/config.ts#isSupabaseConfigured`'s own "all required
 * variables present, or not configured at all" pattern rather than
 * half-configuring a send path.
 *
 * PHASE 34: this function no longer needs to know any provider's specific
 * env var names — that check now lives entirely inside each provider's own
 * `isConfigured()` (see `types/email.ts#EmailProvider`'s own comment on
 * why) — so adding a third provider later never requires editing this
 * file.
 */
export function isEmailServiceConfigured(): boolean {
  const provider = getEmailProvider(getConfiguredProviderName());
  if (!provider) return false;
  if (!process.env.EMAIL_FROM?.trim()) return false;
  return provider.isConfigured();
}

function resolveLocale(locale: string | undefined): Locale {
  return locale && (locales as readonly string[]).includes(locale) ? (locale as Locale) : defaultLocale;
}

/** The app's own public base URL, for building an absolute link an email
 * client can actually open (a relative path is useless in an inbox). Reads
 * the plain `APP_URL` example variable added to `.env.example` — unset in
 * this project's own `.env.local`, so this falls back to the local dev
 * origin, which is honest for an environment with no real provider
 * connected anyway. A real deployment must set `APP_URL` to its real,
 * canonical domain before any of this can send a usable link. */
function getAppBaseUrl(): string {
  const configured = process.env.APP_URL?.trim();
  return (configured || "http://localhost:3000").replace(/\/+$/, "");
}

/** `/orders/[reference]` (UI-23) already renders the full invoice on the
 * same page — see `OrderConfirmationEmailPayload.invoiceUrl`'s own comment
 * for why both links point here today. */
function buildOrderPageUrl(orderReference: string): string {
  return `${getAppBaseUrl()}/orders/${encodeURIComponent(orderReference)}`;
}

/** Masks everything but the first couple of characters of the local part —
 * e.g. "da***@example.com" — so a log line can show enough to correlate
 * with a support ticket without ever recording a customer's full address.
 * Never used for anything except logging; the real address is still what
 * a real send would use. */
function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(local.length - visible.length, 1))}@${domain}`;
}

function buildPayload(order: Order, locale: string | undefined): OrderConfirmationEmailPayload {
  const orderUrl = buildOrderPageUrl(order.orderReference);
  return mapOrderToEmailPayload(order, {
    orderUrl,
    // No separate invoice route exists — see the payload field's own comment.
    invoiceUrl: orderUrl,
    locale: resolveLocale(locale),
  });
}

/**
 * Shared send path for every order-related email this service sends
 * (order confirmation, order invoice, payment status) — all three build
 * from the exact same `buildOrderConfirmationEmail` template today (see
 * that function's own comment: it already IS a full itemized invoice, and
 * this project has no separate invoice content/route to build a second
 * template from), differing only in the `logLabel` used for observability
 * so operators can tell which caller triggered a given log line. Extracted
 * once here rather than copy-pasted three times — the exact same
 * validate → check-configured → build → send → log pipeline every caller
 * needs, and the only place that pipeline needs to change.
 *
 * NEVER throws (every branch resolves a plain `EmailSendResult`) and NEVER
 * logs a card number, CVV, PIN, OTP, access token, API key, or any other
 * secret — none of those fields exist anywhere in `Order`/the email
 * payload to begin with, and only a masked email + order reference +
 * short reason code are ever logged.
 */
async function sendOrderEmail(input: { order: Order; locale?: string }, logLabel: string): Promise<EmailSendResult> {
  const { order } = input;

  if (!order.customer.email || !order.customer.email.includes("@")) {
    console.warn(`[email] ${logLabel} skipped — missing/invalid customer email`, {
      orderReference: order.orderReference,
    });
    return { status: "failed", reason: "MISSING_EMAIL" };
  }

  const maskedEmail = maskEmail(order.customer.email);

  if (!isEmailServiceConfigured()) {
    // Expected, normal state today — logged at "info" (not a warning/error)
    // so a real deployment's logs aren't full of noise before a provider is
    // ever connected. Never logs the email body or the full address.
    console.info(`[email] ${logLabel} not sent — no email provider configured yet`, {
      orderReference: order.orderReference,
      customerEmail: maskedEmail,
    });
    return { status: "not_configured" };
  }

  try {
    // Building the real message even when it turns out not-configured
    // (checked above) is deliberate: it exercises `buildOrderConfirmationEmail`
    // (template/formatting bugs would throw here, caught below) on every
    // real order once a provider is configured, rather than only finding
    // out the templates work the day a provider is first wired up.
    const payload = buildPayload(order, input.locale);
    const built = buildOrderConfirmationEmail(payload);
    const provider = getEmailProvider(getConfiguredProviderName());

    // isEmailServiceConfigured() already guarantees `provider` exists here
    // — this is only a type-narrowing guard, not a reachable "unconfigured"
    // branch.
    if (!provider) {
      return { status: "not_configured" };
    }

    const result = await provider.send({
      to: order.customer.email,
      from: process.env.EMAIL_FROM?.trim() ?? "",
      replyTo: process.env.EMAIL_REPLY_TO?.trim() || undefined,
      subject: built.subject,
      html: built.html,
      text: built.text,
    });

    // Never logs the subject/HTML/text body, the API key, or any provider
    // response body — only the order reference, the masked address, the
    // provider id, and its own short result status/reason code.
    if (result.status === "failed") {
      console.warn(`[email] ${logLabel} failed`, {
        orderReference: order.orderReference,
        customerEmail: maskedEmail,
        provider: provider.id,
        reason: result.reason,
      });
    } else {
      console.info(`[email] ${logLabel} ${result.status}`, {
        orderReference: order.orderReference,
        customerEmail: maskedEmail,
        provider: provider.id,
      });
    }
    return result;
  } catch {
    // Never let a template/formatting bug or an unexpected provider throw
    // surface as a thrown error from this function — the caller must be
    // able to treat every outcome as a plain resolved value (order
    // creation must never fail because of the email step).
    console.warn(`[email] ${logLabel} failed unexpectedly`, { orderReference: order.orderReference });
    return { status: "failed", reason: "UNEXPECTED_ERROR" };
  }
}

/**
 * Sends the order-confirmation email for a real, already-placed `Order`.
 * Safe to call unconditionally after every successful order creation —
 * this NEVER throws and NEVER fails/blocks the order itself: the one real
 * call site (`src/app/api/orders/route.ts`) awaits this only to log the
 * outcome and report it back to the client for display, never to decide
 * whether the order request succeeded.
 *
 * Guards against a missing/invalid customer email defensively even though
 * the real call site can't actually reach this with one today —
 * `create_order()`'s own server-side validation already rejects an order
 * with no valid email before a row is ever written (see that migration's
 * `INVALID_CUSTOMER` check) — so this is a second, independent safety net.
 *
 * Resolves `{ status: "not_configured" }` in this project's own
 * environment (no real `RESEND_API_KEY`/`EMAIL_PROVIDER`/`EMAIL_FROM` set
 * — see `isEmailServiceConfigured`). Once those are genuinely set, this
 * calls `resendProvider`'s real `send()` and returns whatever it resolves
 * — `sent` on success, `failed` on a real provider error — never a
 * fabricated outcome.
 */
export async function sendOrderConfirmationEmail(input: OrderConfirmationEmailInput): Promise<EmailSendResult> {
  return sendOrderEmail(input, "order confirmation");
}

/**
 * Sends an order's invoice by email — PHASE 34. Today this builds and
 * sends the exact same message `sendOrderConfirmationEmail` does: see
 * `emailTemplates.ts`'s own comment on why `buildOrderConfirmationEmail`
 * already IS a full itemized invoice (line items, subtotal, discount,
 * total — matching `OrderInvoice.tsx`'s on-screen fields exactly), and
 * this project has no separate invoice route/content to build a second
 * template from (both `orderUrl` and `invoiceUrl` already point at the
 * same `/orders/[reference]` page).
 *
 * Exposed as its own named function — rather than callers just calling
 * `sendOrderConfirmationEmail` a second time — so a future explicit
 * "email me my invoice" action (a button, or a dedicated route) has a
 * semantically clear, separately-logged entry point (`[email] order
 * invoice ...` vs `[email] order confirmation ...`) without duplicating
 * template/provider logic. Mirrors how `sendPaymentStatusEmail` already
 * exists, typed and ready, before any real caller needed it.
 *
 * Not called from anywhere yet: no "resend"/"email my invoice" action
 * exists in the UI today, and this phase does not add one (its own scope
 * is the email foundation, not a UI redesign) — wiring a real caller to
 * this is a future, separate step once such an action is actually needed.
 */
export async function sendOrderInvoiceEmail(input: OrderConfirmationEmailInput): Promise<EmailSendResult> {
  return sendOrderEmail(input, "order invoice");
}

/**
 * Payment-status-change email — typed and ready, but not called from
 * anywhere yet. The structural pieces exist (`Order.paymentStatus`,
 * `orderRepository.updatePaymentStatus`), but nothing in the live app ever
 * calls `updatePaymentStatus` today — no real payment webhook is
 * implemented (`src/app/api/payments/webhook/route.ts` always responds
 * 501) — so there is no real event to hook this to without inventing one.
 * See that route's own TODO for where a real implementation would call
 * this.
 */
export async function sendPaymentStatusEmail(input: PaymentStatusEmailInput): Promise<EmailSendResult> {
  return sendOrderEmail(input, "payment status email");
}
