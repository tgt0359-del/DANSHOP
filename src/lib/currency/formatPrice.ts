import { convertFromUsd } from "@/lib/currency/exchangeRates";
import { CURRENCIES, type CurrencyCode } from "@/types/currency";

/**
 * Formats a USD amount (every price in this app's data is stored in USD)
 * for display in `currency`: converts via the demo exchange rate, then
 * renders with that currency's symbol and decimal convention (Step 56
 * §7). The one place this conversion+formatting logic lives — every price
 * shown anywhere in the app (product cards, product detail, cart,
 * checkout, order summary, order history) calls this instead of each
 * re-implementing its own `$${x.toFixed(2)}`.
 *
 * Digits are deliberately not locale-formatted (no Lao/Thai numeral
 * system, no locale-specific grouping) — matching how every other number
 * in this app (star ratings, a date's numeric day/year) already stays in
 * plain Arabic numerals across all 3 languages; only surrounding text is
 * translated, never digits.
 */
export function formatPrice(amountUsd: number, currency: CurrencyCode): string {
  const { symbol, decimals } = CURRENCIES[currency];
  const converted = convertFromUsd(amountUsd, currency);
  const formatted = converted.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${symbol}${formatted}`;
}
