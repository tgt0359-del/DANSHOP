"use client";

import { CategoryProductCard } from "@/components/games/CategoryProductCard";
import { isNonInteractiveDemo, productHref } from "@/components/marketplace/CategoryTypeView";
import { hasVariants } from "@/data/productVariants";
import { useLanguage } from "@/hooks/useLanguage";
import type { Product } from "@/types/product";

/**
 * "Related Products" section (Step 51 §10) — reuses `CategoryProductCard`
 * (Step 44), the existing Product-based card, rather than inventing a new
 * one. Shared as-is between the real-game product page
 * (`app/games/[slug]/page.tsx`, real catalog data only) and the new
 * wallet/gift-card product page (`app/product/[slug]/page.tsx`, Step 57 —
 * whose related list can include other demo products), using the same
 * clickable/demo-badge/href logic `CategoryTypeView` already established
 * (imported, not duplicated) so a demo product is never rendered as if it
 * were purchasable in one place and not the other. Hidden entirely when
 * there's nothing to show (e.g. a category with only this one product),
 * the same pattern `RecentlyViewed` already uses.
 */
export function RelatedProducts({ products }: { products: Product[] }) {
  const { t } = useLanguage();

  if (products.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="related-products-heading" className="mt-12 sm:mt-16">
      <h2 id="related-products-heading" className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">
        {t("gameDetail.relatedProducts")}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <CategoryProductCard
            key={product.id}
            product={product}
            isDemo={isNonInteractiveDemo(product)}
            href={productHref(product)}
            showPriceFrom={hasVariants(product.id)}
          />
        ))}
      </div>
    </section>
  );
}
