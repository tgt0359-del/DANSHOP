import { productHref } from "@/components/marketplace/CategoryTypeView";
import { findDemoProductBySlug } from "@/data/demoCatalog";
import { games } from "@/data/games";
import { hasVariants } from "@/data/productVariants";
import { demoProductToGame } from "@/lib/products/variantToGame";
import type { Game } from "@/types/game";

export interface ResolvedGameEntry {
  game: Game;
  /** Where this entry should link to — `/games/<slug>` for a real game, or
   * the correct wallet/gift-card/top-up product route otherwise. */
  href: string;
}

/**
 * Resolves a stored slug (from wishlist or recently-viewed storage) against
 * the real catalog, the same two-step lookup `useRecentlyViewed` originally
 * had inline (Step 47/59) and `resolveCartLine.ts` also does for cart
 * lines — pulled out here (Step 63) so `useWishlistEntries` doesn't have to
 * duplicate it a third time. Tries a real `Game` first; otherwise falls
 * back to the merged demo catalog, but only for a variant-bearing product
 * (`hasVariants`) — a non-variant demo product has no detail page and so
 * can never have been added to a wishlist or recently-viewed list in the
 * first place (no wishlist/recently-viewed control reaches it — see
 * `CategoryProductCard`'s own doc comment). Returns `undefined` for a slug
 * that resolves to neither, so callers can just `.filter()` it out.
 */
export function resolveGameEntry(slug: string): ResolvedGameEntry | undefined {
  const game = games.find((candidate) => candidate.slug === slug);
  if (game) {
    return { game, href: `/games/${game.slug}` };
  }

  const product = findDemoProductBySlug(slug);
  if (!product || !hasVariants(product.id)) return undefined;

  return { game: demoProductToGame(product), href: productHref(product) };
}
