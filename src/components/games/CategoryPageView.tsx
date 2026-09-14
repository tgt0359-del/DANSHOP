"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CategoryProductCard } from "@/components/games/CategoryProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { useLanguage } from "@/hooks/useLanguage";
import type { Product } from "@/types/product";

/**
 * All the rendering (and every translated string) for the category
 * browsing page (Step 44) — kept as one Client Component so
 * `app/games/category/[category]/page.tsx` can stay a Server Component,
 * the same split `/games/[slug]/page.tsx` already uses with
 * `GameDetailInfo`.
 */
export function CategoryPageView({ categoryName, products }: { categoryName: string; products: Product[] }) {
  const { t } = useLanguage();

  return (
    <Reveal>
      <Link
        href="/games"
        prefetch={false}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("category.backToGames")}
      </Link>

      <p className="mt-6 text-xs font-medium uppercase tracking-wide text-secondary">{t("category.eyebrow")}</p>
      <h1 className="text-2xl font-semibold leading-snug text-foreground sm:text-3xl">{categoryName}</h1>

      <p className="mt-2 text-sm text-secondary" aria-live="polite">
        {t("games.resultCount").replace("{count}", String(products.length))}
      </p>

      {products.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <CategoryProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface-elevated px-6 py-16 text-center">
          <p className="text-base font-semibold text-foreground">{t("games.noResultsTitle")}</p>
          <Link
            href="/games"
            prefetch={false}
            className="text-sm font-medium text-foreground underline underline-offset-2"
          >
            {t("category.backToGames")}
          </Link>
        </div>
      )}
    </Reveal>
  );
}
