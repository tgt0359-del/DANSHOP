/**
 * Transient, this-browser-tab-only storage for the last order-confirmation
 * email attempt's outcome (e.g. "sent", "not_configured", "queued",
 * "failed") — Phase 29. Written once by `orderRepository.placeOrder`
 * right after the real `/api/orders` response, read by `OrderSuccessView`
 * to decide which honest, translated sentence to show the customer (never
 * claims "sent" unless the real result says so) and, in development only,
 * an additional raw technical label for debugging.
 *
 * Holds nothing but a short status word — never an email address, never
 * any order content, never anything sensitive. Not part of the persisted
 * `Order` record (`orderStore.ts`): email delivery is a transient,
 * this-visit concern, not a fact the order itself carries, so a later
 * visit to `/orders/[reference]` never shows it.
 */

const STORAGE_KEY = "danshop_last_order_email_status";

export function writeLastOrderEmailStatus(status: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, status);
  } catch {
    // sessionStorage can be unavailable (e.g. privacy mode) — never worth failing an order over.
  }
}

export function readLastOrderEmailStatus(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
