import type { ProductType } from "@/types/product";

/** Registry entry for one marketplace-level product type (Step 54). */
export interface ProductTypeInfo {
  type: ProductType;
  /** URL-safe slug, same convention `data/games.ts`'s genre slugs use —
   * ready for a future route (e.g. `/products/type/[slug]`) that Step 55
   * may build on top of this registry. Not used by any route yet. */
  slug: string;
  /** Localization key for this type's display name — see
   * `locales/*\/common.json`'s `productTypes.*` namespace. A data-layer
   * key, not display text, matching how `Order`'s status fields are
   * translated (see `lib/orders/orderStatusLabels.ts`). */
  translationKey: string;
}

/**
 * Every product type DANSHOP's taxonomy is designed to support (Step 54,
 * revised to Step 57's exact 11-type list). This is the one place that
 * enumerates them — the same role `data/games.ts`'s `getCategories()`
 * already plays for genres — so the marketplace nav/filter (Step 55,
 * Step 57) never has to hardcode this list itself. `slug` here doubles as
 * each type's own `code` (Step 57 §1 gave these exact kebab-case values),
 * used both as the `ProductType` union member and, for the standalone
 * category types, in that category's route (see `data/marketplaceCategories.ts`).
 *
 * Real catalog data now exists for `"game"`/`"pc-game"`/`"mobile-game"`
 * (see `lib/products/productAdapter.ts`'s `deriveProductType`, Step 57
 * §7); the rest are exercised only by Step 57's clearly-labeled demo
 * catalog (`data/demoProducts.ts`) — see that file's own comment for why
 * that's honest, not fabricated-as-real. Order here is a deliberate
 * display order (Games first, then roughly the order Step 57 §1 listed
 * them), not alphabetical.
 */
const PRODUCT_TYPES: ProductTypeInfo[] = [
  { type: "game", slug: "game", translationKey: "productTypes.game" },
  { type: "gift-card", slug: "gift-card", translationKey: "productTypes.giftCard" },
  { type: "steam-wallet", slug: "steam-wallet", translationKey: "productTypes.steamWallet" },
  { type: "game-topup", slug: "game-topup", translationKey: "productTypes.gameTopUp" },
  { type: "mobile-game", slug: "mobile-game", translationKey: "productTypes.mobileGame" },
  { type: "pc-game", slug: "pc-game", translationKey: "productTypes.pcGame" },
  { type: "console", slug: "console", translationKey: "productTypes.console" },
  { type: "game-key", slug: "game-key", translationKey: "productTypes.gameKey" },
  { type: "game-currency", slug: "game-currency", translationKey: "productTypes.gameCurrency" },
  { type: "dlc", slug: "dlc", translationKey: "productTypes.dlc" },
  { type: "software", slug: "software", translationKey: "productTypes.software" },
  // UI-03.2 §6: four additional Product Type filter options, appended
  // (not inserted earlier) so every existing option keeps its current
  // position — see `ProductType`'s own doc comment in `types/product.ts`
  // for why these are honestly-empty additions, same as several types
  // above already were before this step.
  { type: "roblox-gift-card", slug: "roblox-gift-card", translationKey: "productTypes.robloxGiftCard" },
  { type: "danshop", slug: "danshop", translationKey: "productTypes.danshop" },
  { type: "google-play-gift-card", slug: "google-play-gift-card", translationKey: "productTypes.googlePlayGiftCard" },
  { type: "appstore-gift-card", slug: "appstore-gift-card", translationKey: "productTypes.appStoreGiftCard" },
];

/** The full taxonomy — every product type the architecture supports,
 * regardless of whether real catalog data exists for it yet. */
export function getProductTypes(): ProductTypeInfo[] {
  return PRODUCT_TYPES;
}

/** Resolves a product type's URL slug back to its registry entry — the
 * `ProductType`-level analogue of `data/games.ts`'s `getCategoryBySlug`. */
export function getProductTypeBySlug(slug: string): ProductTypeInfo | undefined {
  return PRODUCT_TYPES.find((entry) => entry.slug === slug);
}

/** Looks up a known `ProductType`'s registry entry directly. Every
 * `ProductType` union member has exactly one entry above, so this only
 * returns `undefined` if the two ever drift out of sync with each other. */
export function getProductTypeInfo(type: ProductType): ProductTypeInfo | undefined {
  return PRODUCT_TYPES.find((entry) => entry.type === type);
}
