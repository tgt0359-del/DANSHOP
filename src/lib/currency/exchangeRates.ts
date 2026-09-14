import type { CurrencyCode } from "@/types/currency";

/**
 * Fixed, illustrative exchange rates relative to USD (Step 56 §8).
 *
 * THESE ARE NOT LIVE MARKET RATES — do not present them as such anywhere.
 * They exist only so DANSHOP's UI can show an approximate converted price
 * for browsing convenience; every real order is still created, totaled,
 * and (were a real payment provider ever connected) charged in USD — see
 * `types/payment.ts`'s `Currency` and `lib/orders/orderRepository.ts`,
 * both untouched by this step (Step 33's "do not invent exchange rates"
 * rule, applied here to real money, not display formatting).
 *
 * This is the one seam a trusted, real-time exchange-rate provider would
 * replace later (e.g. an API call, cached and refreshed server-side) —
 * every call site already goes through `getExchangeRate`/`convertFromUsd`
 * (and, for rendering, `formatPrice`), never this map directly, so
 * swapping the implementation here is the entire migration.
 */
const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  THB: 36,
  LAK: 21000,
};

export function getExchangeRate(currency: CurrencyCode): number {
  return EXCHANGE_RATES[currency];
}

/** Converts a USD amount to `currency` using the fixed demo rate above. */
export function convertFromUsd(amountUsd: number, currency: CurrencyCode): number {
  return amountUsd * getExchangeRate(currency);
}

/**
 * The inverse of `convertFromUsd` — converts an amount already denominated
 * in `currency` back to USD (Step 57 — Wallet/Gift Card Product Detail
 * System). Used once, at demo-data-authoring time (`data/productVariants.ts`),
 * to derive each denomination's internal USD `price` from its real-world
 * face value (e.g. a ฿500 Steam Wallet code's price) — reusing this same
 * fixed-rate table rather than a second conversion system, per Step 57
 * §13's "reuse the existing currency conversion architecture".
 */
export function convertToUsd(amount: number, currency: CurrencyCode): number {
  return amount / getExchangeRate(currency);
}
