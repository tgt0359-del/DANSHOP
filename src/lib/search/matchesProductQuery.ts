import { getProductTypeInfo } from "@/data/productTypes";
import { matchesSearchQuery } from "@/lib/search/matchesSearchQuery";
import type { Product } from "@/types/product";

/**
 * Whether one `Product` matches a search query (Step 62 §1) — every field
 * a shopper might reasonably search by: name, description, category,
 * platform, region, and product type. Reuses `matchesSearchQuery`'s exact
 * case-insensitive/partial-match rule (Step 52) unchanged; this is just a
 * richer, shared field list than any single search surface used before —
 * the header's suggestions previously checked only name/slug/description/
 * category/platform (Step 57), which is why a query like "gift" used to
 * only find products whose NAME happened to contain "gift" rather than
 * every actual gift-card-type product (e.g. "PlayStation Store Wallet"
 * literally is a `gift-card`-type product but says "Wallet", not "Gift",
 * in its own name). Now used identically by the header's suggestions
 * (`Navbar.tsx`), the Games page's own search (`useProductFilters.ts`),
 * and the `/search` results page — one matching rule, not three.
 *
 * `productType`'s own slug (e.g. "gift-card", "steam-wallet",
 * "mobile-game" — see `data/productTypes.ts`) is used rather than its
 * translated display label: catalog data itself is never localized (Step
 * 44's "product content stays English regardless of UI language"
 * precedent — the same reason `platform`/`region`/`category` are already
 * untranslated raw values on `Product`), so a query keeps matching the
 * same way no matter which language the UI is currently showing.
 */
export function matchesProductQuery(product: Product, query: string): boolean {
  return matchesSearchQuery(
    [
      product.name,
      product.slug,
      product.description,
      product.shortDescription,
      product.category,
      product.platform,
      product.region,
      getProductTypeInfo(product.productType)?.slug,
    ],
    query
  );
}
