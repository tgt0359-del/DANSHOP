import { games } from "@/data/games";
import { findDemoProductBySlug } from "@/data/demoCatalog";
import { getVariantsForProduct } from "@/data/productVariants";
import { variantToGame } from "@/lib/products/variantToGame";
import type { CartItem } from "@/lib/cart/CartProvider";
import type { Game } from "@/types/game";
import type { TopUpInfo } from "@/types/topUp";

export interface ResolvedCartLine {
  game: Game;
  quantity: number;
  /** Where this line's title/artwork should link to — `/games/<slug>` for
   * a real catalog game, `/top-up/<slug>` for a Game Top-Up package, or
   * `/product/<slug>` for a wallet/gift-card variant. */
  href: string;
  /** The shopper's Player Information (Step 58), carried through purely
   * for display — undefined for every non-Top-Up line. */
  topUpInfo?: TopUpInfo;
  /** The real, accurate platform string (Step 65 §3 — cart items show a
   * platform badge). Deliberately NOT `game.platform`: for a wallet/gift-
   * card/top-up line, `game` is synthesized by `variantToGame`, whose own
   * doc comment is explicit that its `platform` is coerced through
   * `toGamePlatform` purely to satisfy `Game`'s type for rendering things
   * like `GameArtwork`, and is "never shown as the authoritative platform
   * value" — e.g. an Xbox Gift Card's synthesized `game.platform` reads
   * "PC". This field instead carries the real `Product.platform` (Steam,
   * PlayStation, Xbox, ...) for that branch, and the already-accurate
   * `Game.platform` for a real game. */
  platform: string;
}

/**
 * Resolves one stored `CartItem` ({slug, quantity, variantId?,
 * topUpInfo?}) against real catalog data — the one place `CartDrawer` and
 * `useCheckoutLines` both do this lookup, so they can never disagree (Step
 * 57 — Wallet/Gift Card Product Detail System; mirrors the reasoning
 * `useCheckoutLines`'s own file comment already gives for centralizing
 * subtotal/discount/total math).
 *
 * Tries a real `Game` match first — the exact, unchanged lookup both call
 * sites used before this step, so every existing game-only cart is
 * completely unaffected. Only when that fails AND the item carries a
 * `variantId` does it fall back to the merged demo catalog
 * (`data/demoCatalog.ts` — wallet/gift-card products AND, as of Step 58,
 * Game Top-Up games), synthesizing a `Game`-shaped line via
 * `variantToGame` so every downstream consumer keeps working unmodified.
 */
export function resolveCartLine(item: CartItem): ResolvedCartLine | null {
  const game = games.find((candidate) => candidate.slug === item.slug);
  if (game) {
    return { game, quantity: item.quantity, href: `/games/${game.slug}`, platform: game.platform };
  }

  if (!item.variantId) {
    return null;
  }

  const product = findDemoProductBySlug(item.slug);
  if (!product) {
    return null;
  }

  const variant = getVariantsForProduct(product.id).find((candidate) => candidate.id === item.variantId);
  if (!variant) {
    return null;
  }

  const href = product.productType === "game-topup" ? `/top-up/${product.slug}` : `/product/${product.slug}`;

  return {
    game: variantToGame(product, variant),
    quantity: item.quantity,
    href,
    topUpInfo: item.topUpInfo,
    platform: product.platform,
  };
}
