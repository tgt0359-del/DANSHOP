import type { Game, GamePlatform } from "@/types/game";
import type { Platform, Product } from "@/types/product";
import type { ProductVariant } from "@/types/productVariant";

/**
 * `GamePlatform` (types/game.ts) is a strict subset of `Platform`
 * (types/product.ts) — every wallet/gift-card `Platform` value (Steam,
 * PlayStation, Xbox, Nintendo, Console, Cross-platform) has no
 * `GamePlatform` equivalent, since those aren't real games. This mapping
 * is used ONLY to satisfy `Game.platform`'s type for the synthetic object
 * below (rendering purposes — badges/artwork seed — inside components that
 * only know about `Game`); it is never shown as the authoritative platform
 * value. `WalletProductView` displays the real `Product.platform` string
 * directly, unaffected by this simplification.
 */
export function toGamePlatform(platform: Platform): GamePlatform {
  switch (platform) {
    case "PC":
    case "Mobile":
    case "PC & Mobile":
      return platform;
    default:
      return "PC";
  }
}

/**
 * Synthesizes a `Game`-shaped object from a wallet/gift-card `Product` +
 * the `ProductVariant` (denomination) a shopper selected (Step 57 —
 * Wallet/Gift Card Product Detail System). This is the one adapter that
 * lets every existing Game-consuming component — `GameArtwork`,
 * `OrderSummary`, `OrderReviewView`, `OrderSuccessView`, `OrderDetailView`,
 * `OrderCard` — work completely unchanged for variant-based cart/order
 * lines, the same way `productAdapter.ts`'s `gameToProduct` already lets
 * `Product`-shaped code work from real `Game` data. Nothing here is
 * persisted; it is only ever computed on the fly to render one cart/order
 * line.
 *
 * `id` combines the product and variant ids (`"<productId>::<variantId>"`)
 * so two denominations of the same product (e.g. a ฿50 and a ฿500 Steam
 * Wallet code) get distinct, stable ids — this is what lets them appear as
 * two separate lines (and two separate `GameArtwork` seeds) instead of
 * colliding, everywhere a list keys or looks up by `game.id`. `slug` stays
 * the plain product slug (shared across a product's variants) since it is
 * a real, navigable route (`/product/<slug>`) — only one detail page
 * exists per product, not per denomination.
 */
export function variantToGame(product: Product, variant: ProductVariant): Game {
  const hasDiscount = variant.originalPrice != null && variant.originalPrice > variant.price;
  const discount = hasDiscount ? Math.round((1 - variant.price / (variant.originalPrice as number)) * 100) : 0;

  return {
    id: `${product.id}::${variant.id}`,
    title: `${product.name} — ${variant.label}`,
    slug: product.slug,
    platform: toGamePlatform(product.platform),
    genre: product.category,
    description: product.shortDescription,
    price: variant.price,
    originalPrice: hasDiscount ? (variant.originalPrice as number) : variant.price,
    discount,
    rating: product.rating,
    image: product.image,
    releaseDate: product.createdAt.slice(0, 10),
  };
}

/**
 * Synthesizes a `Game`-shaped object from a wallet/gift-card/top-up
 * `Product` directly — no denomination/package selected (Step 59, for
 * `useRecentlyViewed`'s "Recently Viewed" row, which records a product
 * visit before any variant is chosen). Uses the product's own `price`
 * (the lowest variant's price, Step 57's "starting from" convention) and
 * `originalPrice` (always `null` at the product level — discounts only
 * ever exist per-variant, see `demoProducts.ts`'s own comment) rather than
 * any specific denomination's.
 */
export function demoProductToGame(product: Product): Game {
  return {
    id: product.id,
    title: product.name,
    slug: product.slug,
    platform: toGamePlatform(product.platform),
    genre: product.category,
    description: product.shortDescription,
    price: product.price,
    originalPrice: product.originalPrice ?? product.price,
    discount: 0,
    rating: product.rating,
    image: product.image,
    releaseDate: product.createdAt.slice(0, 10),
  };
}
