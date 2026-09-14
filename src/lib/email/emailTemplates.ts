import en from "@/locales/en/common.json";
import lo from "@/locales/lo/common.json";
import th from "@/locales/th/common.json";
import type { Locale } from "@/lib/i18n/config";
import { formatShortDate } from "@/lib/formatDate";
import { formatPrice } from "@/lib/currency/formatPrice";
import { orderPaymentStatusTranslationKey } from "@/lib/orders/orderPaymentStatusLabels";
import { orderStatusTranslationKey } from "@/lib/orders/orderStatusLabels";
import type { Order, OrderPaymentStatus, OrderStatus } from "@/types/order";
import type { Currency } from "@/types/payment";

/**
 * Order-confirmation email content — pure template building, no sending
 * (see `emailService.ts` for that). Server-only: this module has no "use
 * client" boundary to cross, but it must never be imported by a Client
 * Component either — it exists purely to be called from a server-side
 * route/service.
 *
 * Localization (Phase: Order Email Notification Foundation §4/§5): reuses
 * this app's REAL, already-translated/approved copy — the exact same
 * `src/locales/{en,lo,th}/common.json` files `LanguageProvider` reads for
 * every on-screen string — via a small local `translate()` below that
 * mirrors `LanguageProvider.tsx`'s own `getNestedValue` lookup. This
 * intentionally is NOT a React hook (this code runs server-side, outside
 * any component tree), but it is the same data, so the email can never say
 * something different from what the website itself says for the same
 * key. A handful of keys genuinely new to this phase (greeting, thank-you
 * line, "View Invoice", a support note) were added to all three locale
 * files rather than hardcoded here — see the `email.*` namespace in those
 * files.
 */

const messagesByLocale: Record<Locale, unknown> = { en, lo, th };

function getNestedValue(source: unknown, path: string): string | undefined {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, source) as string | undefined;
}

/** Same key-lookup behavior as `useLanguage().t()` — falls back to the raw
 * key (never throws, never renders blank) if a key is ever missing. */
function translate(locale: Locale, key: string): string {
  return getNestedValue(messagesByLocale[locale], key) ?? key;
}

/** `text.replace("{token}", value)` — the exact interpolation convention
 * `checkout.qty` ("Qty {count}") already uses across the app; reused here
 * rather than inventing a second templating syntax. */
function interpolate(text: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((acc, [token, value]) => acc.split(`{${token}}`).join(value), text);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface OrderConfirmationEmailItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * The typed shape every order-related email template builds from —
 * deliberately NOT the raw `Order` record itself: `orderUrl`/`invoiceUrl`
 * don't exist on `Order` (they're computed at send time, see
 * `emailService.ts`), and `locale` is a per-email concern the stored order
 * never carries (see that file's comment on why). Nothing here is or ever
 * includes a payment credential, card number, CVV, PIN, OTP, or secret —
 * `Order`/`OrderItem` (types/order.ts) have no such fields to begin with.
 */
export interface OrderConfirmationEmailPayload {
  locale: Locale;
  orderReference: string;
  /** ISO calendar date (yyyy-mm-dd) — the same slice of `Order.createdAt`
   * every on-screen order view already formats with `formatShortDate`. */
  orderDate: string;
  customerName: string;
  customerEmail: string;
  items: OrderConfirmationEmailItem[];
  subtotal: number;
  discount: number;
  total: number;
  currency: Currency;
  paymentMethod: string;
  paymentStatus: OrderPaymentStatus;
  orderStatus: OrderStatus;
  /** Links to the real, existing `/orders/[reference]` page (UI-23). */
  orderUrl: string;
  /** Same URL as `orderUrl` today — this project has no separate invoice
   * route; `/orders/[reference]` already renders the full invoice
   * (`OrderInvoice`, UI-23) on the same page. Kept as its own field (not
   * just reusing `orderUrl` at the call site) so a real, separate invoice
   * URL can be introduced later without changing this payload's shape or
   * every template that reads it. */
  invoiceUrl: string;
}

/** Maps a real, persisted `Order` (types/order.ts) into the email payload
 * above. The only fields not already on `Order` — `orderUrl`/`invoiceUrl`/
 * `locale` — are supplied by the caller (`emailService.ts`), which is the
 * one place that knows the app's base URL and the checkout visit's active
 * language. No field here is invented: every value is copied straight off
 * the order record. */
export function mapOrderToEmailPayload(
  order: Order,
  options: { orderUrl: string; invoiceUrl: string; locale: Locale }
): OrderConfirmationEmailPayload {
  return {
    locale: options.locale,
    orderReference: order.orderReference,
    orderDate: order.createdAt.slice(0, 10),
    customerName: order.customer.fullName,
    customerEmail: order.customer.email,
    items: order.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    orderUrl: options.orderUrl,
    invoiceUrl: options.invoiceUrl,
  };
}

/**
 * Which headline this ONE email template shows (Phase UI-27 §2 —
 * "Order confirmation / Order pending payment / Order paid/successful /
 * Order cancelled"). Deliberately a single template whose intro copy
 * adapts to the order's real, already-stored status, rather than four
 * near-duplicate template functions repeating the same branding/items/
 * totals/buttons markup — the same "one shared thing, not a copy per
 * variant" reasoning `OrderSummary`/`ProductInfoSection` already follow
 * elsewhere in this app. "cancelled" is included because `OrderStatus`/
 * `OrderPaymentStatus` (types/order.ts) already define it as a real,
 * supported value — not a new status invented for this phase.
 */
function resolveHeadlineKey(payload: OrderConfirmationEmailPayload): string {
  if (payload.orderStatus === "cancelled" || payload.paymentStatus === "cancelled") {
    return "email.orderCancelledTitle";
  }
  if (payload.paymentStatus === "paid" || payload.orderStatus === "paid" || payload.orderStatus === "completed") {
    return "email.paymentReceivedTitle";
  }
  // pending_payment / processing / refunded / expired / failed — the
  // general "we received your order" copy already covers every one of
  // these honestly (none of them claim a payment outcome that isn't true).
  return "email.thankYou";
}

export function buildOrderConfirmationEmailSubject(payload: OrderConfirmationEmailPayload): string {
  return `${payload.orderReference} — ${translate(payload.locale, resolveHeadlineKey(payload))}`;
}

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

/** The DANSHOP letterhead — plain inline-styled text (no logo image
 * asset exists, matching `components/ui/Logo.tsx`'s own "styled text
 * wordmark, no image yet" approach). */
function brandMarkHtml(): string {
  return (
    '<span style="font-size:20px;font-weight:700;color:#111111;letter-spacing:-0.02em;">DAN</span>' +
    '<span style="font-size:20px;font-weight:500;color:#6b7280;letter-spacing:-0.02em;">SHOP</span>'
  );
}

function itemRowHtml(item: OrderConfirmationEmailItem, payload: OrderConfirmationEmailPayload): string {
  const qtyLabel = translate(payload.locale, "gameDetail.quantityLabel");
  const unitPriceLabel = translate(payload.locale, "wallet.unitPrice");
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111111;font-family:Arial,Helvetica,sans-serif;">
        ${escapeHtml(item.productName)}
        <div style="margin-top:2px;font-size:12px;color:#6b7280;">
          ${escapeHtml(qtyLabel)}: ${item.quantity} · ${escapeHtml(unitPriceLabel)}: ${formatPrice(item.unitPrice, payload.currency)}
        </div>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#111111;text-align:right;white-space:nowrap;font-family:Arial,Helvetica,sans-serif;">
        ${formatPrice(item.totalPrice, payload.currency)}
      </td>
    </tr>`;
}

/**
 * Builds the order-confirmation email (subject + HTML + plain-text) for a
 * real, already-placed order — the headline adapts to the order's real
 * status (see `resolveHeadlineKey`: pending/default, payment received, or
 * cancelled), covering every status-specific variant Phase UI-27 §2 asks
 * for without four separate near-duplicate templates. Design direction
 * (Phase §4): white background, black text, light-gray borders, one
 * rounded card, minimal spacing, the same DANSHOP wordmark used site-wide
 * — table-based layout
 * with fully inline styles, since most email clients strip `<style>`
 * blocks or ignore modern CSS (flex/grid) entirely; a small `<style>`
 * block is still included for the handful of clients that do honor a
 * `max-width` media query, as progressive enhancement only.
 *
 * Never renders a card number, CVV, PIN, OTP, or any secret — there is no
 * such field on `OrderConfirmationEmailPayload` to render in the first
 * place. Every customer-supplied string (`customerName`, `customerEmail`,
 * each `item.productName`) is HTML-escaped before being interpolated.
 *
 * PHASE 34: the customer's email address is now shown as its own row
 * (right after Order Date) — a confirmation-of-destination convention many
 * real order emails use, distinct from the greeting above it (which
 * already personalizes with `customerName`, so that field isn't repeated
 * as a second row here).
 */
export function buildOrderConfirmationEmail(payload: OrderConfirmationEmailPayload): BuiltEmail {
  const t = (key: string) => translate(payload.locale, key);
  const subject = buildOrderConfirmationEmailSubject(payload);

  const greeting = interpolate(t("email.greeting"), { name: payload.customerName || t("checkout.customerInfo") });
  const headline = t(resolveHeadlineKey(payload));
  const orderDateFormatted = formatShortDate(payload.orderDate, payload.locale);
  const orderStatusLabel = t(orderStatusTranslationKey[payload.orderStatus]);
  const paymentStatusLabel = t(orderPaymentStatusTranslationKey[payload.paymentStatus]);

  const itemsHtml = payload.items.map((item) => itemRowHtml(item, payload)).join("");

  const discountRowHtml =
    payload.discount > 0
      ? `<tr>
           <td style="padding:4px 0;font-size:14px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(t("checkout.discount"))}</td>
           <td style="padding:4px 0;font-size:14px;color:#111111;text-align:right;font-family:Arial,Helvetica,sans-serif;">-${formatPrice(payload.discount, payload.currency)}</td>
         </tr>`
      : "";

  const html = `<!doctype html>
<html lang="${payload.locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
    <style>
      @media only screen and (max-width: 600px) {
        .danshop-email-card { width: 100% !important; }
        .danshop-email-padded { padding-left: 20px !important; padding-right: 20px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="danshop-email-card" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:16px;">
            <tr>
              <td class="danshop-email-padded" style="padding:28px 32px;border-bottom:1px solid #e5e7eb;">
                ${brandMarkHtml()}
              </td>
            </tr>
            <tr>
              <td class="danshop-email-padded" style="padding:28px 32px;font-family:Arial,Helvetica,sans-serif;">
                <p style="margin:0 0 4px;font-size:14px;color:#6b7280;">${escapeHtml(greeting)}</p>
                <h1 style="margin:0 0 20px;font-size:20px;line-height:1.4;color:#111111;">${escapeHtml(headline)}</h1>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;">
                        <tr>
                          <td style="padding:4px 0;color:#6b7280;">${escapeHtml(t("checkout.orderNumber"))}</td>
                          <td style="padding:4px 0;color:#111111;text-align:right;font-weight:600;">${escapeHtml(payload.orderReference)}</td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0;color:#6b7280;">${escapeHtml(t("orders.orderDate"))}</td>
                          <td style="padding:4px 0;color:#111111;text-align:right;">${escapeHtml(orderDateFormatted)}</td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0;color:#6b7280;">${escapeHtml(t("checkout.email"))}</td>
                          <td style="padding:4px 0;color:#111111;text-align:right;word-break:break-all;">${escapeHtml(payload.customerEmail)}</td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0;color:#6b7280;">${escapeHtml(t("checkout.status"))}</td>
                          <td style="padding:4px 0;color:#111111;text-align:right;">${escapeHtml(orderStatusLabel)}</td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0;color:#6b7280;">${escapeHtml(t("orders.paymentStatusLabel"))}</td>
                          <td style="padding:4px 0;color:#111111;text-align:right;">${escapeHtml(paymentStatusLabel)}</td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0;color:#6b7280;">${escapeHtml(t("checkout.paymentMethod"))}</td>
                          <td style="padding:4px 0;color:#111111;text-align:right;">${escapeHtml(payload.paymentMethod)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-top:1px solid #e5e7eb;">
                  ${itemsHtml}
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;font-family:Arial,Helvetica,sans-serif;">
                  <tr>
                    <td style="padding:4px 0;font-size:14px;color:#6b7280;">${escapeHtml(t("cart.subtotal"))}</td>
                    <td style="padding:4px 0;font-size:14px;color:#111111;text-align:right;">${formatPrice(payload.subtotal, payload.currency)}</td>
                  </tr>
                  ${discountRowHtml}
                  <tr>
                    <td style="padding:12px 0 0;font-size:17px;font-weight:700;color:#111111;border-top:1px solid #e5e7eb;">${escapeHtml(t("checkout.total"))}</td>
                    <td style="padding:12px 0 0;font-size:17px;font-weight:700;color:#111111;text-align:right;border-top:1px solid #e5e7eb;">${formatPrice(payload.total, payload.currency)}</td>
                  </tr>
                </table>

                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                  <tr>
                    <td style="padding-right:8px;">
                      <a href="${escapeHtml(payload.orderUrl)}" style="display:inline-block;background-color:#111111;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;padding:12px 22px;border-radius:9999px;">${escapeHtml(t("checkout.viewOrderDetails"))}</a>
                    </td>
                    <td>
                      <a href="${escapeHtml(payload.invoiceUrl)}" style="display:inline-block;background-color:#ffffff;color:#111111;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;padding:12px 22px;border-radius:9999px;border:1px solid #e5e7eb;">${escapeHtml(t("email.viewInvoice"))}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="danshop-email-padded" style="padding:20px 32px;border-top:1px solid #e5e7eb;background-color:#fafafa;border-radius:0 0 16px 16px;font-family:Arial,Helvetica,sans-serif;">
                <p style="margin:0;font-size:12px;color:#6b7280;">${escapeHtml(t("email.supportNote"))}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textLines = [
    greeting,
    headline,
    "",
    `${t("checkout.orderNumber")}: ${payload.orderReference}`,
    `${t("orders.orderDate")}: ${orderDateFormatted}`,
    `${t("checkout.email")}: ${payload.customerEmail}`,
    `${t("checkout.status")}: ${orderStatusLabel}`,
    `${t("orders.paymentStatusLabel")}: ${paymentStatusLabel}`,
    `${t("checkout.paymentMethod")}: ${payload.paymentMethod}`,
    "",
    ...payload.items.map(
      (item) =>
        `${item.productName} — ${t("gameDetail.quantityLabel")}: ${item.quantity} × ${formatPrice(item.unitPrice, payload.currency)} = ${formatPrice(item.totalPrice, payload.currency)}`
    ),
    "",
    `${t("cart.subtotal")}: ${formatPrice(payload.subtotal, payload.currency)}`,
    ...(payload.discount > 0 ? [`${t("checkout.discount")}: -${formatPrice(payload.discount, payload.currency)}`] : []),
    `${t("checkout.total")}: ${formatPrice(payload.total, payload.currency)}`,
    "",
    `${t("checkout.viewOrderDetails")}: ${payload.orderUrl}`,
    `${t("email.viewInvoice")}: ${payload.invoiceUrl}`,
    "",
    t("email.supportNote"),
  ];

  return { subject, html, text: textLines.join("\n") };
}
