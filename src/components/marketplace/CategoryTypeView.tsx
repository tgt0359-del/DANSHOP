"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CategoryProductCard } from "@/components/games/CategoryProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { useLanguage } from "@/hooks/useLanguage";
import { getMarketplaceCategoryBySlug } from "@/data/marketplaceCategories";
import { hasVariants } from "@/data/productVariants";
import type { Product } from "@/types/product";

/**
 * Shared rendering for every marketplace category page (Step 57 §9) — the
 * one implementation behind both `app/[category]/page.tsx` (the 7
 * standalone categories) and the 3 `/games/pc`/`/games/mobile`/
 * `/games/console` routes, so there's no duplicated page implementation
 * per category (Step 57 §19). Mirrors `CategoryPageView.tsx`'s existing
 * structure (Step 44) closely on purpose — same back-link/heading/
 * result-count/grid/empty-state shape, just generalized to any
 * `MarketplaceCategory` instead of a hardcoded "genre" concept.
 *
 * Demo-ness (Step 57 §8's "Demo" badge + non-interactive card treatment)
 * is decided per product, not per page: `data/demoProducts.ts` gives
 * every demo record an id prefixed `"demo-"`, which is the one signal
 * `isDemoProduct` checks. This matters because `/games/console` mixes
 * zero real console games with Step 57's one demo console listing —
 * a page-wide flag couldn't represent that correctly, while checking each
 * product individually handles it (and every other category) uniformly.
 *
 * Takes `categorySlug` (a plain string), not the full `MarketplaceCategory`
 * object — that entry's `icon` field is a component reference, and a
 * Server Component page (every caller here) can't pass a function as a
 * prop to a Client Component like this one (React Server Components can
 * only serialize plain data across that boundary). Re-resolving the full
 * entry from the same registry here, client-side, is a cheap local array
 * lookup and keeps the registry itself as the single source of truth —
 * no second, duplicated category list.
 */
function isDemoProduct(product: Product): boolean {
  return product.id.startsWith("demo-");
}

/**
 * A demo product still counts as "Demo"/non-clickable UNLESS it has real
 * denominations to choose from (Step 57 — Wallet/Gift Card Product Detail
 * System) — those get a genuine, interactive `/product/<slug>` page, so
 * they should behave like any other real, purchasable listing here.
 * Exported so `RelatedProducts.tsx` (used on both the real-game product
 * page and the new wallet product page) renders the exact same
 * clickable/demo-badge decision for any product, not a second copy of it.
 */
export function isNonInteractiveDemo(product: Product): boolean {
  return isDemoProduct(product) && !hasVariants(product.id);
}

export function productHref(product: Product): string {
  if (!hasVariants(product.id)) {
    return `/games/${product.slug}`;
  }
  // Step 58: a Game Top-Up product's flow lives at /top-up/<slug> (its own
  // multi-step Region/Server → Package → Player Information flow, not the
  // wallet template) — every other variant-bearing product still uses the
  // wallet/gift-card template's /product/<slug>.
  return product.productType === "game-topup" ? `/top-up/${product.slug}` : `/product/${product.slug}`;
}

export function CategoryTypeView({ categorySlug, products }: { categorySlug: string; products: Product[] }) {
  const { t } = useLanguage();
  const category = getMarketplaceCategoryBySlug(categorySlug);
  // Step 57: a variant-bearing demo product now has a real, interactive
  // detail page and can genuinely be added to cart — only a *non*-
  // interactive demo product (no denominations) is what this notice is
  // warning about.
  const hasDemoProducts = products.some(isNonInteractiveDemo);

  if (!category) return null;

  const Icon = category.icon;

  return (
    <Reveal>
      <Link
        href="/"
        prefetch={false}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("marketplace.backToHome")}
      </Link>

      <div className="mt-6 flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface text-foreground">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold leading-snug text-foreground sm:text-3xl">{t(category.nameKey)}</h1>
          <p className="text-sm text-secondary">{t(category.descriptionKey)}</p>
        </div>
      </div>

      {hasDemoProducts && (
        <p className="mt-4 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-secondary">
          {t("marketplace.demoNotice")}
        </p>
      )}

      <p className="mt-4 text-sm text-secondary" aria-live="polite">
        {t("marketplace.resultCount").replace("{count}", String(products.length))}
      </p>

      {products.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
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
      ) : (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-border bg-white px-6 py-16 text-center">
          <p className="text-base font-semibold text-foreground">{t("marketplace.noResultsTitle")}</p>
          <Link href="/" prefetch={false} className="text-sm font-medium text-foreground underline underline-offset-2">
            {t("marketplace.backToHome")}
          </Link>
        </div>
      )}
    </Reveal>
  );
}
