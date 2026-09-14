import type { CurrencyCode } from "@/types/currency";

/**
 * One selectable denomination of a wallet, gift-card, or top-up product
 * (Step 57 — Wallet/Gift Card Product Detail System). Deliberately a
 * SEPARATE concept from `Product` (types/product.ts), not a new field on
 * it: almost every product (every real game) has no variants at all, so
 * bolting an optional array onto every `Product` would mean every
 * existing consumer of that type has to know about a field that's almost
 * always empty. A product "has variants" simply by having ≥1 entry here
 * whose `productId` matches it — see `data/productVariants.ts`'s
 * `getVariantsForProduct`/`hasVariants`. Nothing on `Product` itself
 * changes; `Product.price` still holds a sensible standalone value (the
 * lowest variant's price) for contexts that only know about `Product`
 * (search results, category cards).
 */
export interface ProductVariant {
  id: string;
  productId: string;
  /**
   * Precomputed display label for this denomination's own face value,
   * e.g. "฿50", "$25" — NOT converted to the viewer's selected display
   * currency (Step 56's `CurrencyProvider`). A "500 THB Steam Wallet
   * Code" is a fixed real-world SKU name regardless of what currency the
   * buyer's prices are shown in, the same way a "$50 Xbox Gift Card"
   * keeps that name for a Lao-Kip-displaying visitor — only `price`
   * below (via `formatPrice`) converts to their chosen currency.
   */
  label: string;
  /** The face value itself, in `currency`. */
  value: number;
  /** Which currency `value`/`label` are denominated in — this variant's
   * own fixed real-world currency, independent of the viewer's display
   * currency preference. */
  currency: CurrencyCode;
  /**
   * What this variant costs, in USD (DANSHOP's internal base currency —
   * matches every other `Product.price` in the app). Derived from
   * `value`/`currency` via `convertToUsd` at demo-data-authoring time
   * (see `data/productVariants.ts`), then formatted for display through
   * the same `formatPrice()` every other price in the app already uses.
   */
  price: number;
  /** null when not discounted — same convention as `Product.originalPrice`. */
  originalPrice: number | null;
  /** Demo availability only (Step 57 §7) — never implies real wallet
   * inventory exists. */
  available: boolean;
  /** Display order within the product's denomination list. */
  sortOrder: number;
}
