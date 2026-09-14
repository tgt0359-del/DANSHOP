import { cache } from "react";
import { allDemoProducts } from "@/data/demoCatalog";
import { games } from "@/data/games";
import { getDiscountPercent } from "@/lib/products/discount";
import { gameToProduct } from "@/lib/products/productAdapter";
import { fetchProductsFromSupabase } from "@/lib/products/productSupabaseSource";
import type { Platform, Product, ProductCategory, ProductType } from "@/types/product";

/**
 * The product catalog's service layer (Step 35, connected to Supabase in
 * Step 39, Supabase made primary for product-detail-by-slug in Step 40) —
 * the one place the rest of the app asks for product data, never Supabase
 * directly (Step 39 §5's "UI → ProductRepository → Supabase", never "UI →
 * Supabase"). See lib/products/README.md for which existing pages read
 * through this layer already, and for which parts of the catalog
 * (search/filter/sort on the Games page, the homepage listing sections)
 * deliberately still read `Game`/`data/games.ts` directly instead — a
 * documented, reasoned exception, not an oversight.
 *
 * Every function here is async, for one reason: `getProducts()` tries
 * Supabase first and falls back to the local `games` catalog (via
 * gameToProduct) if Supabase isn't configured, the read fails, or it
 * returns zero rows (e.g. a freshly-created project that hasn't been
 * seeded yet — see supabase/seed.sql). Every other function already
 * derived its result from `getProducts()` before Step 39 (Step 35's own
 * design) and is otherwise completely unchanged — this is what let the
 * whole repository gain Supabase support from one seam instead of eight
 * separate ones.
 */

/** All products, in the catalog's natural order. Tries Supabase first,
 * falls back to the local static catalog — see the file comment above for
 * exactly which conditions trigger the fallback.
 *
 * Wrapped in React's `cache()` (Step 40): the product detail page now
 * calls `getProductBySlug()` from both `generateMetadata` and the page
 * component for the same request (see app/games/[slug]/page.tsx) —
 * `cache()` is Next.js's documented per-request dedup mechanism, so that
 * costs one Supabase query per page load, not two. This is the "Next.js's
 * own per-request fetch memoization" the README already flagged as the
 * natural next step once Supabase was queried from more than one call
 * site — no other caching layer was added (see the README's
 * "Data-fetching approach" section). */
export const getProducts = cache(async (): Promise<Product[]> => {
  const remoteProducts = await fetchProductsFromSupabase();
  if (remoteProducts !== null && remoteProducts.length > 0) {
    return remoteProducts;
  }
  return games.map(gameToProduct);
});

/**
 * Every real product plus every demo catalog (`data/demoCatalog.ts`'s
 * `allDemoProducts` — Step 57's wallet/gift-card catalog and Step 58's
 * Game Top-Up catalog) — used by the marketplace category pages (Step 57
 * §9) and `getProductsByType` below, never by the Games page itself
 * (`app/games/page.tsx` still calls `getProducts()` directly, so its
 * catalog composition — real games only — is completely unchanged, per
 * Step 57 §17's "do not break existing search/filter/sort behavior").
 * Demo products are frontend-only data and are never written to Supabase.
 */
export async function getMarketplaceProducts(): Promise<Product[]> {
  const products = await getProducts();
  return [...products, ...allDemoProducts];
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((product) => product.id === id);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((product) => product.slug === slug);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((product) => product.isFeatured);
}

export async function getNewProducts(): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((product) => product.isNew);
}

/** Discounted products, biggest discount first — mirrors data/games.ts's
 * existing getDealGames(). */
export async function getDiscountedProducts(): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((product) => product.isOnSale).sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a));
}

export async function getProductsByCategory(category: ProductCategory): Promise<Product[]> {
  const normalized = category.toLowerCase();
  const products = await getProducts();
  return products.filter((product) => product.category.toLowerCase() === normalized);
}

export async function getProductsByPlatform(platform: Platform): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((product) => product.platform === platform);
}

/**
 * Every product of one marketplace-level type (Step 54, extended Step
 * 57) — real catalog products (now correctly split across `"game"`/
 * `"pc-game"`/`"mobile-game"`/`"console"` by platform — see
 * `productAdapter.ts`'s `deriveProductType`) plus Step 57's demo catalog
 * for the types that have no real data yet. Searches
 * `getMarketplaceProducts()` (not plain `getProducts()`) specifically so
 * the new standalone category pages (`/gift-cards`, `/steam-wallet`, ...)
 * see the demo listings that make them non-empty; the Games page's own
 * Product Type filter (Step 55.1) still calls `getProducts()` directly,
 * so it's unaffected by this broadening.
 */
export async function getProductsByType(productType: ProductType): Promise<Product[]> {
  const products = await getMarketplaceProducts();
  return products.filter((product) => product.productType === productType);
}

/**
 * Matches against product name, category, and platform (Step 35 §6),
 * case-insensitively, on any substring. As of Step 42, `Platform` includes
 * "PC & Mobile" and the live Supabase data has been corrected to use it
 * (see `supabase/migrations/20260907020000_danshop_platform_widen.sql`),
 * so a query like "mobile" now correctly matches those products too —
 * verified live in Step 43's audit. The Games page still uses its own,
 * separate search logic against local `Game` data rather than this
 * function, but that's now a "not yet wired up" state, not a correctness
 * gap this function has — see lib/products/README.md.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const normalized = query.trim().toLowerCase();
  const products = await getProducts();
  if (normalized === "") return products;

  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(normalized) ||
      product.category.toLowerCase().includes(normalized) ||
      product.platform.toLowerCase().includes(normalized)
  );
}
