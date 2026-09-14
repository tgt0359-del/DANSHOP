/**
 * The Gift Card marketplace's own "Product Type" filter facet (Step 59
 * §3) — deliberately NOT the app-wide `ProductType` (types/product.ts):
 * that type is the marketplace-level section a listing belongs to (Games
 * vs. Gift Cards vs. Steam Wallet vs. Game Currency, ...) and already has
 * real values ("gift-card", "steam-wallet") this filter would collide
 * with if reused directly, while two of this filter's four options
 * ("Gaming Gift Card", "Subscription") have no `ProductType` equivalent
 * at all. Kept as its own small, page-scoped facet — the same "side-table
 * keyed by productId" pattern `data/topUpFieldConfig.ts` already
 * established for a page-specific classification that doesn't belong on
 * the shared `Product` shape. "subscription" has no matching product yet
 * — offered honestly-empty, the same precedent `Platform`/`Region`'s own
 * doc comments already set for a taxonomy value ahead of real data.
 */
export type GiftCardKind = "gift-card" | "gaming-gift-card" | "wallet" | "subscription";
