"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CategoryProductCard } from "@/components/games/CategoryProductCard";
import { Container } from "@/components/ui/Container";
import { FilterChip } from "@/components/games/GamesCatalog";
import { MobileFilterDrawer } from "@/components/games/MobileFilterDrawer";
import { MultiSelectFilter } from "@/components/games/MultiSelectFilter";
import { RecentlyViewed } from "@/components/games/RecentlyViewed";
import { Reveal } from "@/components/ui/Reveal";
import { Select } from "@/components/ui/Select";
import { isNonInteractiveDemo, productHref } from "@/components/marketplace/CategoryTypeView";
import { giftCardCategories } from "@/data/giftCardMeta";
import { getMarketplaceCategoryBySlug } from "@/data/marketplaceCategories";
import { hasVariants } from "@/data/productVariants";
import { useLanguage } from "@/hooks/useLanguage";
import {
  PRICE_BUCKET_LABEL_KEY,
  useGiftCardFilters,
  type PriceBucket,
} from "@/hooks/useGiftCardFilters";
import { cn } from "@/lib/cn";
import { platformTranslationKey } from "@/lib/products/platformLabels";
import { regionTranslationKey } from "@/lib/products/regionLabels";
import type { GiftCardKind } from "@/types/giftCard";
import type { Platform, Product, Region } from "@/types/product";

const KIND_OPTIONS: GiftCardKind[] = ["gift-card", "gaming-gift-card", "wallet", "subscription"];
const PLATFORM_OPTIONS: Platform[] = [
  "Steam",
  "PlayStation",
  "Xbox",
  "Nintendo",
  "Google Play",
  "Apple",
  "Roblox",
  "Garena",
  "Other",
];
const REGION_OPTIONS: Region[] = ["Global", "Thailand", "Laos", "United States", "Europe", "Other"];
const PRICE_BUCKET_OPTIONS: PriceBucket[] = ["under5", "5to10", "10to25", "25plus"];

/**
 * The Gift Card marketplace (Step 59) — search, Popular Gift Cards,
 * browsing categories, a full checkbox filter panel (desktop sidebar /
 * mobile drawer, mirroring `GamesCatalog.tsx`'s established pattern
 * exactly via the shared `MultiSelectFilter`/`MobileFilterDrawer`/
 * `FilterChip`/`FilterField` components — §3's "use the existing minimal
 * checkbox filter pattern"), sort, Recently Viewed, and the product grid.
 * `products` is the Gift Card marketplace's own product set — every
 * `gift-card`/`steam-wallet`/`game-currency` demo product (see
 * `app/gift-cards/page.tsx`), all of which have real denominations and a
 * genuine `/product/<slug>` detail page (Step 57), so every card here is
 * fully interactive: no "Demo" badge, no non-clickable card.
 */
export function GiftCardMarketplaceView({ products }: { products: Product[] }) {
  const { t } = useLanguage();
  const filters = useGiftCardFilters(products);
  const {
    query,
    setQuery,
    category,
    setCategory,
    categoryCounts,
    kinds,
    toggleKind,
    kindCounts,
    platforms,
    togglePlatform,
    platformCounts,
    regions,
    toggleRegion,
    regionCounts,
    priceBuckets,
    togglePriceBucket,
    sort,
    setSort,
    results,
    chips,
    activeFilterCount,
    hasActiveFilters,
    clearFilters,
  } = filters;

  const [drawerOpen, setDrawerOpen] = useState(false);

  const popularProducts = products.filter((product) => product.isFeatured);
  const isSearching = query.trim() !== "";
  // Step 61: resolves the icon from the same centralized registry
  // `CategoryTypeView`/`TopUpLandingView` already read, for the same
  // icon-circle + "Back to Home" header treatment every other category
  // page uses — the visible heading text keeps this page's own more
  // specific `giftCards.pageDescription` copy below, unchanged. Named
  // `pageCategory` (not `category`) to avoid colliding with the filter
  // state's own `category` above — a different concept (the selected
  // category *filter*, not this page's own registry entry).
  const pageCategory = getMarketplaceCategoryBySlug("gift-cards");
  const PageIcon = pageCategory?.icon;

  const kindOptions = KIND_OPTIONS.map((value) => ({ value, label: t(`giftCards.kind.${value}`) }));
  const platformOptions = PLATFORM_OPTIONS.map((value) => ({ value, label: t(platformTranslationKey[value]) }));
  const regionOptions = REGION_OPTIONS.map((value) => ({ value, label: t(regionTranslationKey[value]) }));
  const priceBucketOptions = PRICE_BUCKET_OPTIONS.map((value) => ({ value, label: t(PRICE_BUCKET_LABEL_KEY[value]) }));

  function renderFilterFields(idPrefix: string) {
    return (
      <>
        <MultiSelectFilter<GiftCardKind>
          idPrefix={`${idPrefix}-kind`}
          legend={t("games.filters.productTypeLabel")}
          options={kindOptions}
          selected={kinds}
          onToggle={toggleKind}
          counts={kindCounts}
        />
        <MultiSelectFilter<Platform>
          idPrefix={`${idPrefix}-platform`}
          legend={t("games.filters.platformLabel")}
          options={platformOptions}
          selected={platforms}
          onToggle={togglePlatform}
          counts={platformCounts}
        />
        <MultiSelectFilter<Region>
          idPrefix={`${idPrefix}-region`}
          legend={t("games.filters.regionLabel")}
          options={regionOptions}
          selected={regions}
          onToggle={toggleRegion}
          counts={regionCounts}
        />
        <MultiSelectFilter<PriceBucket>
          idPrefix={`${idPrefix}-price`}
          legend={t("games.filters.priceLabel")}
          options={priceBucketOptions}
          selected={priceBuckets}
          onToggle={togglePriceBucket}
        />
      </>
    );
  }

  return (
    <div className="py-10 sm:py-12 lg:py-16">
      <Container>
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
          {PageIcon && (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface text-foreground">
              <PageIcon className="h-6 w-6" aria-hidden="true" />
            </span>
          )}
          <div>
            <h1 className="text-2xl font-semibold leading-snug text-foreground sm:text-3xl">{t("nav.giftCards")}</h1>
            <p className="text-sm text-secondary">{t("giftCards.pageDescription")}</p>
          </div>
        </div>

        <RecentlyViewed />

        {/* UI-05 §6: same clean-white/subtle-border/comfortable-height search
            box as before, now with the same soft resting shadow the sidebar
            and product cards use — polish only, no new field, no logic
            change (still the same `query`/`setQuery` state). */}
        <div className="relative mt-6 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("giftCards.searchPlaceholder")}
            aria-label={t("giftCards.searchPlaceholder")}
            className="h-11 w-full rounded-full border border-border bg-white pl-10 pr-4 text-sm text-foreground shadow-sm placeholder:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          />
        </div>

        {!isSearching && popularProducts.length > 0 && (
          <section aria-labelledby="giftcards-popular-heading" className="mt-8">
            {/* UI-05 §1: bumped from text-lg/semibold to xl/bold — the same
                "premium, more prominent section heading" direction the
                Games page's own Trending/All Games headings already use,
                applied consistently to both section headings on this page
                (this one and Categories below) without adopting Games'
                exact 3-tier responsive size (not required, keeps this a
                polish, not a redesign). */}
            <h2 id="giftcards-popular-heading" className="text-xl font-bold leading-snug text-foreground">
              {t("giftCards.popularTitle")}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {popularProducts.map((product) => (
                <CategoryProductCard
                  key={product.id}
                  product={product}
                  isDemo={isNonInteractiveDemo(product)}
                  href={productHref(product)}
                  showPriceFrom={hasVariants(product.id)}
                  tallImage
                />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="giftcards-categories-heading" className="mt-8">
          <h2 id="giftcards-categories-heading" className="text-xl font-bold leading-snug text-foreground">
            {t("giftCards.categoriesTitle")}
          </h2>
          {/* UI-05 §2: "cleaner and more prominent" — slightly larger
              padding and row gap than before (px-4/py-2/gap-2 →
              px-4.5/py-2.5/gap-2.5) and a soft resting shadow matching the
              rest of the page's cards/sidebar/search, same shape/behavior/
              selected-state/count placement otherwise. flex-wrap already
              lets long Lao/Thai/English category names wrap naturally
              instead of overlapping. */}
          <div role="group" aria-labelledby="giftcards-categories-heading" className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setCategory(null)}
              aria-pressed={category === null}
              className={cn(
                "rounded-full border px-4.5 py-2.5 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                category === null
                  ? "border-black bg-black text-white"
                  : "border-border bg-white text-foreground hover:border-foreground/40"
              )}
            >
              {t("giftCards.categoryAll")}
            </button>
            {giftCardCategories.map((entry) => {
              const selected = category === entry.value;
              // UI-03.5 §6: a real product count, tallied from this page's
              // own already-fetched `products` (see `useGiftCardFilters`'s
              // `categoryCounts` comment) — this section is a pill-button
              // row, not the checkbox-list layout `MultiSelectFilter`
              // renders, so the count is shown inline after each pill's
              // own label (muted, smaller) rather than a separate right-
              // aligned column, which doesn't apply to wrapping pills.
              // Selected pills flip to a dark background, so the count
              // switches to a light, still-muted tone to stay readable.
              const count = categoryCounts[entry.value] ?? 0;
              return (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => setCategory(entry.value)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-full border px-4.5 py-2.5 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                    selected
                      ? "border-black bg-black text-white"
                      : "border-border bg-white text-foreground hover:border-foreground/40"
                  )}
                >
                  {t(entry.labelKey)}
                  <span className={cn("ml-1.5 text-xs font-normal tabular-nums", selected ? "text-white/70" : "text-secondary")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Desktop filter sidebar, always visible at lg (1024px) and up —
              same cutover point GamesCatalog uses (Step 55 §11). */}
          {/* UI-05 §1: a soft resting shadow + slightly more generous
              internal padding/section gap (p-5/gap-5 → p-6/gap-6), matching
              the "very light shadows, generous but controlled whitespace"
              premium direction the Games sidebar already established —
              width/columns/breakpoint unchanged, so the lg-and-up layout
              doesn't shift. */}
          <aside className="hidden shrink-0 lg:block lg:w-64 xl:w-72">
            <div className="flex flex-col gap-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
              {renderFilterFields("giftcard-filter")}
              <Button type="button" variant="secondary" onClick={clearFilters} disabled={!hasActiveFilters} className="w-full">
                {t("games.clearFilters")}
              </Button>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                {t("games.filters.filtersButton")}
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-xs font-semibold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="ml-auto flex items-center gap-2">
                <label htmlFor="giftcards-sort" className="hidden text-xs font-medium text-secondary sm:block">
                  {t("games.filters.sortLabel")}
                </label>
                <Select
                  id="giftcards-sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as typeof sort)}
                  className="w-44 shadow-sm sm:w-52"
                >
                  <option value="recommended">{t("games.filters.sortRecommended")}</option>
                  <option value="priceLowHigh">{t("games.filters.sortPriceLowHigh")}</option>
                  <option value="priceHighLow">{t("games.filters.sortPriceHighLow")}</option>
                  <option value="ratingHighLow">{t("games.filters.sortRatingHighLow")}</option>
                  <option value="newest">{t("games.filters.sortNewest")}</option>
                </Select>
              </div>
            </div>

            <MobileFilterDrawer
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              onApply={() => setDrawerOpen(false)}
              onClearAll={clearFilters}
              hasActiveFilters={hasActiveFilters}
            >
              {renderFilterFields("giftcard-filter-mobile")}
            </MobileFilterDrawer>

            {chips.length > 0 && (
              <div
                className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                aria-label={t("games.filters.activeFilters")}
              >
                {chips.map((chip) => (
                  <FilterChip
                    key={chip.key}
                    label={chip.label}
                    onRemove={chip.onRemove}
                    removeLabel={t("games.filters.removeFilter").replace("{filter}", chip.label)}
                  />
                ))}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="shrink-0 whitespace-nowrap px-1 text-xs font-medium text-secondary underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  {t("games.clearFilters")}
                </button>
              </div>
            )}

            {/* UI-05 §9: text-sm → text-[15px], matching the Games page's
                own result-count line exactly — a small typography-
                consistency polish, sitting directly under the Sort control
                above so the two read as one aligned block; no change to
                sorting/result logic. */}
            <p className="mt-4 text-[15px] text-secondary" aria-live="polite">
              {t("marketplace.resultCount").replace("{count}", String(results.length))}
            </p>

            {results.length > 0 ? (
              // UI-04: matches this page's own "Popular Gift Cards" grid
              // above (also `lg:grid-cols-4`) — both sections share the
              // exact same sidebar-adjusted content width on this page, so
              // they now switch to 4 columns at the same breakpoint instead
              // of the results grid staying at 3 columns until `xl` while
              // Popular already showed 4 from `lg`.
              <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {results.map((product) => (
                  <CategoryProductCard
                    key={product.id}
                    product={product}
                    isDemo={isNonInteractiveDemo(product)}
                    href={productHref(product)}
                    showPriceFrom={hasVariants(product.id)}
                    tallImage
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-4 rounded-2xl border border-border bg-white px-6 py-16 text-center">
                <p className="text-base font-semibold text-foreground">{t("marketplace.noResultsTitle")}</p>
                <Button type="button" variant="secondary" onClick={clearFilters}>
                  {t("games.clearFilters")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Reveal>
      </Container>
    </div>
  );
}
