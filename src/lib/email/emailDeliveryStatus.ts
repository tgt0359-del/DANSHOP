import type { EmailSendResult } from "@/types/email";

/**
 * PHASE 34 (Real Order Email Notification Foundation) — the exactly-three
 * customer-facing states this app ever shows for an order's confirmation
 * email (Phase §6: "Email sent" / "Email delivery not configured" /
 * "Email delivery failed"). Deliberately fewer than `EmailSendResult`'s
 * own four internal statuses: `queued` reads the same as `sent` to a
 * customer (the provider accepted the message for delivery either way),
 * and "not yet known" (e.g. the brief instant before a client component
 * has read a stored result) folds into the same bucket as `not_configured`
 * — never shown as a false "failed", and never a fabricated "sent".
 */
export type EmailUiStatus = "sent" | "not_configured" | "failed";

/**
 * Classifies a raw email-send outcome into the one of three states above —
 * the single place this mapping happens, so the checkout success page and
 * any future surface can never disagree about what a given status means.
 *
 * Pure and side-effect-free (no `process.env`, no `window`/storage access)
 * — safe to import from either server code (right after a real
 * `sendOrderConfirmationEmail()`/`sendOrderInvoiceEmail()` result) or a
 * "use client" component (reading a stored status string, e.g. from
 * `lastOrderEmailStatus.ts`). Accepts a plain string rather than the full
 * `EmailSendResult` union so a client component reading a bare stored
 * string (or `null`, before it has loaded) doesn't need to reconstruct a
 * whole result object just to classify it.
 */
export function getEmailDeliveryStatus(rawStatus: EmailSendResult["status"] | string | null | undefined): EmailUiStatus {
  if (rawStatus === "sent" || rawStatus === "queued") return "sent";
  if (rawStatus === "failed") return "failed";
  // "not_configured", not-yet-known (null/undefined), or any unrecognized
  // value all fold into the same honest, non-alarming default.
  return "not_configured";
}
