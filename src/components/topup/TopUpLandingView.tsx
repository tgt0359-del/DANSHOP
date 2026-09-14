"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { CategoryProductCard } from "@/components/games/CategoryProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { getMarketplaceCategoryBySlug } from "@/data/marketplaceCategories";
import { useLanguage } from "@/hooks/useLanguage";
import { matchesSearchQuery } from "@/lib/search/matchesSearchQuery";
import type { Product } from "@/types/product";

/** The Game Top-Up section's own 4-way taxonomy (Step 58 §1) — the exact
 * `Product.category` string every demo game in `data/topUpGames.ts` uses,
 * paired with its translated chip label. `value: null` is the "All Games"
 * chip (no category filter applied). */
const CATEGORY_FILTERS: { value: string | null; labelKey: string }[] = [
  { value: null, labelKey: "topup.categoryAll" },
  { value: "Mobile Games", labelKey: "topup.categoryMobile" },
  { value: "PC Games", labelKey: "topup.categoryPC" },
  { value: "Console Games", labelKey: "topup.categoryConsole" },
  { value: "Other Games", labelKey: "topup.categoryOther" },
];

/**
 * The Game Top-Up marketplace landing page (Step 58 §6) — search, a
 * Popular Games row, category filter chips, and the full game grid. Takes
 * plain `games: Product[]` from the server page (already `getTopUpGames()`
 * — see `app/top-up/page.tsx`); everything below is client-side filtering
 * over that one list, the same "search/filter client-side over a small,
 * known catalog" approach `GamesCatalog.tsx` already established.
 */
export function TopUpLandingView({ games }: { games: Product[] }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const category = getMarketplaceCategoryBySlug("top-up");

  const popularGames = useMemo(() => games.filter((game) => game.isFeatured), [games]);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      if (activeCategory && game.category !== activeCategory) return false;
      return matchesSearchQuery([game.name, game.slug, game.description, game.category, game.platform], query);
    });
  }, [games, activeCategory, query]);

  const isSearching = query.trim() !== "";

  if (!category) return null;

  const Icon = category.icon;

  return (
    <Reveal>
      <Link
        href="/"
        prefetch={false}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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

      <p className="mt-4 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-secondary">
        {t("topup.demoNotice")}
      </p>

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("topup.searchPlaceholder")}
          aria-label={t("topup.searchPlaceholder")}
          className="h-11 w-full rounded-full border border-border bg-surface-elevated pl-10 pr-4 text-sm text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        />
      </div>

      {!isSearching && popularGames.length > 0 && (
        <section aria-labelledby="topup-popular-heading" className="mt-8">
          <h2 id="topup-popular-heading" className="text-lg font-semibold leading-snug text-foreground">
            {t("topup.popularGamesTitle")}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {popularGames.map((game) => (
              <CategoryProductCard key={game.id} product={game} href={`/top-up/${game.slug}`} showPriceFrom />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="topup-categories-heading" className="mt-8">
        <h2 id="topup-categories-heading" className="text-lg font-semibold leading-snug text-foreground">
          {t("topup.categoriesTitle")}
        </h2>
        <div role="group" aria-labelledby="topup-categories-heading" className="mt-3 flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((filter) => {
            const selected = activeCategory === filter.value;
            return (
              <button
                key={filter.labelKey}
                type="button"
                onClick={() => setActiveCategory(filter.value)}
                aria-pressed={selected}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  selected
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface-elevated text-foreground hover:border-border-strong"
                )}
              >
                {t(filter.labelKey)}
              </button>
            );
          })}
        </div>
      </section>

      <p className="mt-6 text-sm text-secondary" aria-live="polite">
        {t("marketplace.resultCount").replace("{count}", String(filteredGames.length))}
      </p>

      {filteredGames.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {filteredGames.map((game) => (
            <CategoryProductCard key={game.id} product={game} href={`/top-up/${game.slug}`} showPriceFrom />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface-elevated px-6 py-16 text-center">
          <p className="text-base font-semibold text-foreground">{t("marketplace.noResultsTitle")}</p>
        </div>
      )}
    </Reveal>
  );
}
