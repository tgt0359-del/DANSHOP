import type { Currency } from "@/types/payment";

/**
 * The platforms this architecture is prepared to support. As of Step 42,
 * this is a proper superset of the existing catalog's `GamePlatform`
 * (types/game.ts): every `GamePlatform` value ("PC" / "Mobile" /
 * "PC & Mobile") maps losslessly onto one of these, and this type adds
 * "Console" for products the catalog doesn't have yet. Before Step 42,
 * this type had no way to represent "PC & Mobile" at all, which forced
 * `lib/products/productAdapter.ts` to lossily simplify it to "PC" — see
 * that file's history and `supabase/migrations/20260907020000_danshop_platform_widen.sql`
 * for the fix (a live Supabase project must have that migration applied
 * for its `products.platform` column to actually accept "PC & Mobile";
 * this type only reflects what the *application* now supports).
 *
 * Step 54 adds "Cross-platform" — distinct from "PC & Mobile" (which means
 * "playable on both"), this means "platform doesn't meaningfully apply",
 * for future product types like gift cards or subscriptions that aren't
 * tied to a device at all. No existing product uses this value; it exists
 * so the type is ready once real non-game catalog data does (see
 * `data/productTypes.ts`).
 *
 * Step 56 (filter redesign) adds "Steam"/"PlayStation"/"Xbox"/"Nintendo" —
 * plain, descriptive platform/storefront names (no logos, no claimed
 * partnership), the same way this app already says "Steam Wallet" in
 * text. "Steam" now has real matches: the 3 Steam Wallet demo products
 * (see `data/demoProducts.ts`) were reassigned from the generic
 * "Cross-platform" to the more accurate "Steam". The 3 console-brand
 * values have no matching product yet — offered honestly as empty filter
 * options, the same precedent "Console" itself set in Step 54/57.
 *
 * Step 59 (Gift Card Marketplace) adds "Google Play"/"Apple"/"Roblox"/
 * "Garena"/"Other" — the same plain-storefront-name convention, now with
 * real matches too (`data/demoProducts.ts`'s Google Play/Apple/Garena/
 * Roblox gift cards were reassigned from "Cross-platform" to their actual
 * storefront, and the generic "Universal Gaming Gift Card" genuinely has
 * no single platform, hence "Other").
 */
export type Platform =
  | "PC"
  | "Mobile"
  | "Console"
  | "PC & Mobile"
  | "Cross-platform"
  | "Steam"
  | "PlayStation"
  | "Xbox"
  | "Nintendo"
  | "Google Play"
  | "Apple"
  | "Roblox"
  | "Garena"
  | "Other";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

/**
 * A product's genre/category. Left as a plain string rather than a fixed
 * union like Platform — genres are numerous and open-ended (see the
 * existing catalog's `genre` values), so a closed union here would need
 * constant upkeep as new categories are added. Still centralized as its
 * own named type (not raw string literals scattered around) so category
 * typing has exactly one source to change later if it ever does need to
 * become a closed set.
 *
 * Note this is a *genre* (Action, RPG, Strategy, ...) — a sub-classification
 * that today only really applies within Games. It's a different axis from
 * `ProductType` below, which is the marketplace's top-level section
 * (Games vs. Gift Cards vs. Steam Wallet, ...). A product has exactly one
 * of each: `category` says what kind of game/software it is, `productType`
 * says what kind of *listing* it is.
 */
export type ProductCategory = string;

/**
 * DANSHOP's marketplace-level product type taxonomy (Step 54, revised to
 * Step 57's exact 11-code list — a deliberate replacement, not an
 * addition: Step 57 gave explicit `code:` values for a refined set of
 * types, several of which split what Step 54 called generic `"game"` into
 * platform-specific listings). See `data/productTypes.ts` for the display
 * registry (slugs, translation keys, icons) built on top of this type.
 *
 * `"game"` remains a real, honest value — not every real game splits
 * cleanly into `"pc-game"`/`"mobile-game"` (a `"PC & Mobile"`-platform
 * title genuinely isn't just one of those), so `"game"` is the correct
 * type for those, and the generic fallback in general. See
 * `lib/products/productAdapter.ts`'s `deriveProductType` for exactly how
 * each real product's type is assigned from its platform (Step 57 §7).
 * The other values are prepared for real catalog data later — Step 57
 * §8/§10's demo catalog (`data/demoProducts.ts`) populates most of them
 * with clearly-labeled, non-purchasable demo records so the taxonomy is
 * visibly exercised without pretending they're real.
 *
 * UI-03.2 §6 adds four more Product Type filter options at the requesting
 * step's explicit direction — "roblox-gift-card"/"google-play-gift-card"/
 * "appstore-gift-card" (platform-specific gift cards, alongside the
 * existing generic "gift-card") and "danshop" (a DANSHOP-branded type).
 * Same honestly-empty pattern every prior addition to this union already
 * followed (see this comment's own history, and `Region`'s doc comment
 * below): no product's real `productType` becomes one of these, and no
 * catalog data is invented to populate them — they exist in the filter UI
 * exactly like several pre-existing types already did before any real or
 * demo data ever matched them.
 */
export type ProductType =
  | "game"
  | "gift-card"
  | "steam-wallet"
  | "game-topup"
  | "mobile-game"
  | "pc-game"
  | "console"
  | "game-key"
  | "game-currency"
  | "dlc"
  | "software"
  | "roblox-gift-card"
  | "danshop"
  | "google-play-gift-card"
  | "appstore-gift-card";

/**
 * Where a product is valid/available for purchase (Step 54). "Global"
 * covers every real product in the catalog today — DANSHOP has no
 * region-locked inventory yet, so this is an honest default reflecting
 * reality, not a fabricated value (see `lib/products/productAdapter.ts`
 * and `productSupabaseSource.ts`, which both set it to "Global" for
 * exactly that reason). "Thailand"/"Laos" mirror the two local markets
 * this app already serves via its `th`/`lo` locales, ready for a future
 * region-specific product (e.g. a Thailand-only mobile top-up).
 *
 * Step 56 (filter redesign) adds "United States"/"Europe"/"Asia" — wider,
 * honestly-empty options for the Region filter's "show more" set (every
 * real/demo product stays "Global" — see `productAdapter.ts`/
 * `productSupabaseSource.ts`/`data/demoProducts.ts`, none of which needed
 * to change to add this).
 *
 * Step 59 (Gift Card Marketplace) adds "Other" — a generic catch-all
 * region option for that page's Region filter, offered honestly-empty
 * like "Asia" before it (no product needs it today).
 *
 * Step 66 (Games Page Filter UI Refinement) adds "Japan"/"South
 * Korea"/"Turkey" — more of the same honestly-empty "show more" set,
 * popular digital-goods regions real marketplaces commonly list, per that
 * step's own explicit instruction to widen the Region filter's options.
 * No product's real `region` value changes — every one still stays
 * "Global", exactly as every prior region addition here already was.
 */
export type Region =
  | "Global"
  | "Thailand"
  | "Laos"
  | "United States"
  | "Europe"
  | "Asia"
  | "Japan"
  | "South Korea"
  | "Turkey"
  | "Other";

/**
 * The catalog's backend-ready product shape (Step 35). This is a NEW,
 * additional layer over the existing, still-authoritative `Game` type
 * (types/game.ts) and its `games` data (data/games.ts) — nothing here
 * replaces those; every existing page/component keeps using `Game`
 * exactly as before. `lib/products/productAdapter.ts`'s `gameToProduct`
 * converts between the two, so this type can move toward a real
 * database's shape over time without requiring every existing consumer
 * to change at once (see lib/products/README.md).
 */
export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  category: ProductCategory;
  /** The marketplace-level listing type (Step 54) — see `ProductType`'s
   * own doc comment for how this differs from `category` above. */
  productType: ProductType;
  platform: Platform;
  /** Step 54 — see `Region`'s own doc comment. */
  region: Region;
  price: number;
  /** null when not discounted. (The older Game type instead repeats
   * `price` here when there's no discount — this field is intentionally
   * nullable per Step 35 §1.) */
  originalPrice: number | null;
  currency: Currency;
  rating: number;
  /** No real review data exists in this project yet — always 0 rather
   * than a fabricated plausible-looking number (the same reasoning the
   * SEO step used to leave out an incomplete aggregateRating schema). */
  reviewCount: number;
  image: string;
  images: string[];
  /** A data-layer tag, not display text — a real UI would translate this
   * key itself rather than render it directly, which is why this field
   * doesn't need an entry in the localization system. */
  badge: "featured" | "trending" | null;
  isFeatured: boolean;
  isNew: boolean;
  isOnSale: boolean;
  stockStatus: StockStatus;
  createdAt: string;
  updatedAt: string;
}
