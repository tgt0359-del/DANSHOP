import type { Game, GamePlatform } from "@/types/game";
import type { Platform, Product, ProductType } from "@/types/product";

/** How recent a release has to be to count as "new" — an arbitrary,
 * demo-reasonable window; a real backend would likely make this configurable. */
const NEW_WINDOW_DAYS = 30;

/**
 * Step 42: `Platform` now includes "PC & Mobile" (see
 * `supabase/migrations/20260907020000_danshop_platform_widen.sql`), so
 * every `GamePlatform` value already exists verbatim in `Platform` — this
 * is a lossless identity mapping, not a simplification. Kept as its own
 * named function (rather than inlining `game.platform` directly) so a
 * future, genuinely divergent platform value still has exactly one place
 * to reconcile, matching how this file isolates every other Game→Product
 * field mapping.
 */
function mapPlatform(platform: GamePlatform): Platform {
  return platform;
}

/**
 * Assigns each real product's marketplace `ProductType` from its platform
 * (Step 57 §7's worked example: Crimson Horizon/Nova Drift (PC) → PC
 * Games, Skybound Legends (Mobile) → Mobile Games). A single-platform
 * title maps cleanly onto `"pc-game"`/`"mobile-game"`; a `"PC & Mobile"`
 * title genuinely isn't just one of those, so it keeps the generic
 * `"game"` type rather than an inaccurate single-platform label — no real
 * product has `platform: "Console"` today, so `"console"` is never
 * produced here (it stays a demo-only type — see `data/demoProducts.ts`).
 * Exported so `productSupabaseSource.ts` derives the exact same type from
 * a Supabase row's `platform` column, keeping both sources in agreement.
 */
export function deriveProductType(platform: GamePlatform | Platform): ProductType {
  switch (platform) {
    case "PC":
      return "pc-game";
    case "Mobile":
      return "mobile-game";
    default:
      return "game";
  }
}

function isReleasedWithinDays(releaseDate: string, days: number): boolean {
  const releasedAt = new Date(releaseDate).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return releasedAt >= cutoff;
}

/**
 * Converts an existing `Game` record into the new `Product` shape — the
 * compatibility layer Step 35 asks for, so the formal Product model can
 * exist without duplicating or replacing `data/games.ts`'s real data.
 * Every field is derived from real, existing Game data; nothing here
 * fabricates content (see the `reviewCount`/`createdAt`/`updatedAt`
 * comments below for the handful of fields with no real equivalent yet).
 */
export function gameToProduct(game: Game): Product {
  const hasDiscount = game.discount > 0;
  const createdAt = new Date(game.releaseDate).toISOString();

  return {
    id: game.id,
    slug: game.slug,
    name: game.title,
    description: game.description,
    // No separate short/long description exists in the current catalog —
    // both fields hold the same text until real content differentiates them.
    shortDescription: game.description,
    category: game.genre,
    // Step 57: derived from the real platform value below, not hardcoded —
    // see deriveProductType's own comment. DANSHOP still has no
    // region-restricted inventory, so region stays an honest "Global" for
    // all real products (see types/product.ts's Region doc comment).
    productType: deriveProductType(game.platform),
    platform: mapPlatform(game.platform),
    region: "Global",
    price: game.price,
    originalPrice: hasDiscount ? game.originalPrice : null,
    currency: "USD",
    rating: game.rating,
    // No real review data exists in this project yet — see types/product.ts.
    reviewCount: 0,
    image: game.image,
    images: [game.image],
    badge: game.featured ? "featured" : game.trending ? "trending" : null,
    isFeatured: game.featured ?? false,
    isNew: isReleasedWithinDays(game.releaseDate, NEW_WINDOW_DAYS),
    isOnSale: hasDiscount,
    // Digital goods with no real inventory concept — always in stock. See types/product.ts.
    stockStatus: "in_stock",
    createdAt,
    // No real update history exists yet — releaseDate is the closest honest proxy.
    updatedAt: createdAt,
  };
}
