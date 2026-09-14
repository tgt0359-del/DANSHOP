/**
 * DANSHOP's user-facing DISPLAY currency (Step 56) — deliberately a
 * separate concept from `types/payment.ts`'s `Currency` ("LAK" | "USD"),
 * which is the TRANSACTIONAL currency an order/payment is actually
 * recorded in (always "USD" today — see that file's own comments, and
 * Step 33's "do not invent exchange rates" rule for real money).
 *
 * Every real price in this app's data (`Game.price`, `Product.price`,
 * `Order.total`, ...) is stored and computed in USD; `CurrencyCode` only
 * controls what symbol/converted number is shown to the customer for
 * browsing convenience, never what's actually charged or written to an
 * order record. Keeping the two separate means adding THB/LAK display
 * support here never touches checkout math, `Order.currency`, or the
 * Supabase `orders`/`products`/`payments` tables' `currency` CHECK
 * constraints (`in ('LAK', 'USD')`) — no schema change needed for this step.
 */
export type CurrencyCode = "USD" | "THB" | "LAK";

export const currencyCodes: readonly CurrencyCode[] = ["USD", "THB", "LAK"];

export const defaultCurrency: CurrencyCode = "USD";

export interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  name: string;
  /** Decimal places to display. Lao Kip is conventionally shown as a
   * whole number in everyday use (no minor unit in common circulation);
   * USD/THB show cents/satang. */
  decimals: number;
}

/**
 * The one centralized currency definition (Step 56 §4) — every selector,
 * chip, and price formatter reads from this single map; nothing else in
 * the app defines its own separate list of currencies/symbols/names.
 */
export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", decimals: 2 },
  THB: { code: "THB", symbol: "฿", name: "Thai Baht", decimals: 2 },
  LAK: { code: "LAK", symbol: "₭", name: "Lao Kip", decimals: 0 },
};

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (currencyCodes as readonly string[]).includes(value);
}
