"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CategoryProductCard } from "@/components/games/CategoryProductCard";
import { Container } from "@/components/ui/Container";
import { FilterChip, FilterField, PLATFORM_OPTIONS, REGION_OPTIONS } from "@/components/games/GamesCatalog";
import { MobileFilterDrawer } from "@/components/games/MobileFilterDrawer";
import { MultiSelectFilter } from "@/components/games/MultiSelectFilter";
import { isNonInteractiveDemo, productHref } from "@/components/marketplace/CategoryTypeView";
import { Reveal } from "@/components/ui/Reveal";
import { Select } from "@/components/ui/Select";
import { getMarketplaceCategoryBySlug } from "@/data/marketplaceCategories";
import { getProductTypes } from "@/data/productTypes";
import { hasVariants } from "@/data/productVariants";
import { useLanguage } from "@/hooks/useLanguage";
import { PRICE_PRESETS, useSearchResultFilters, type PricePreset } from "@/hooks/useSearchResultFilters";
import { platformTranslationKey } from "@/lib/products/platformLabels";
import { regionTranslationKey } from "@/lib/products/regionLabels";
import type { Product } from "@/types/product";

/** Step 62 §5 — the categories a shopper with no results is offered
 * instead, resolved from the same central registry every other nav
 * surface reads (no separate hardcoded list) so a route/label change
 * there is picked up here automatically. */
const BROWSE_CATEGORY_SLUGS = ["games", "gift-cards", "steam-wallet", "wallets", "top-up", "dlc"];

// Step 66 §1/§3/§4/§5's "first 6, then Show more" convention — reused as-is
// (see `useSearchResultFilters.ts`'s file comment for why the filtering
// logic itself is a separate hook, not a separate design).
const FILTER_INITIAL_VISIBLE = 6;

function pricePresetLabel(preset: PricePreset, t: (key: string) => string): string {
  switch (preset.key) {
    case "under5":
      return t("games.filters.priceUnder5");
    case "under10":
      return t("games.filters.priceUnder10");
    case "10to25":
      return t("games.filters.price10to25");
    case "25plus":
      return t("games.filters.price25plus");
    default:
      return preset.key;
  }
}

/**
 * The marketplace search results page (Step 62 §4, filters added Step 70
 * §2/§6/§7) — `/search?q=<query>`. `products` is prepared server-side by
 * `app/search/page.tsx`: every product (real games via `getProducts()`,
 * plus the full demo catalog) that matches the query, via the same
 * `matchesProductQuery` the header suggestions and the Games page's own
 * search already use (Step 62 §1) — one matching rule everywhere, not a
 * fourth reimplementation. Renders through the exact same
 * `CategoryProductCard` every other catalog page already uses (§4's "do
 * not create a completely separate product-card design"), with the same
 * href/demo-badge/"from" logic (`productHref`/`isNonInteractiveDemo`/
 * `hasVariants`) `GiftCardMarketplaceView`/`WalletMarketplaceView`/
 * `RelatedProducts` already established.
 *
 * Step 70 §6/§7: now offers the same Product Type/Platform/Region/Price
 * filters and the same sort options as the Games page, through
 * `useSearchResultFilters` — a `Product[]`-native sibling of
 * `useProductFilters` (see that hook's own comment for why they're not the
 * same hook) built from the exact same `MultiSelectFilter`/`FilterChip`/
 * `MobileFilterDrawer`/`PRICE_PRESETS` pieces, laid out the same way
 * (sticky left sidebar at `lg`+, a drawer below that) — this step's own
 * "respect the current Games-page filter design" instruction. Filter/sort
 * state lives only on this page (plain `useState`, not the URL), matching
 * `useProductFilters`'s own established precedent of not yet persisting
 * filter state to `URLSearchParams` (see that hook's file comment) — only
 * the search query itself (`?q=`) is a real, shareable URL parameter.
 */
export function SearchResultsView({ query, products }: { query: string; products: Product[] }) {
  const { t } = useLanguage();
  const filters = useSearchResultFilters(products);
  const {
    productTypes,
    toggleProductType,
    platforms,
    togglePlatform,
    regions,
    toggleRegion,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    setPricePreset,
    isPricePresetActive,
    sort,
    setSort,
    results,
    chips,
    activeFilterCount,
    hasActiveFilters,
    clearFilters,
  } = filters;

  const [drawerOpen, setDrawerOpen] = useState(false);

  const productTypeOptions = getProductTypes().map((info) => ({ value: info.type, label: t(info.translationKey) }));
  const platformOptions = PLATFORM_OPTIONS.map((value) => ({ value, label: t(platformTranslationKey[value]) }));
  const regionOptions = REGION_OPTIONS.map((value) => ({ value, label: t(regionTranslationKey[value]) }));

  const browseCategories = BROWSE_CATEGORY_SLUGS.map((slug) => getMarketplaceCategoryBySlug(slug)).filter(
    (category): category is NonNullable<typeof category> => category !== undefined
  );

  /** Every filter field, rendered identically in the desktop sidebar and
   * the mobile drawer — the same "one function, two `idPrefix`es" pattern
   * `GamesCatalog.tsx` already uses (see that file's own comment for why:
   * one shared state/handlers, two valid `id`/`htmlFor` pairs). */
  function renderFilterFields(idPrefix: string) {
    return (
      <>
        <MultiSelectFilter
          idPrefix={`${idPrefix}-product-type`}
          legend={t("games.filters.productTypeLabel")}
          options={productTypeOptions}
          selected={productTypes}
          onToggle={toggleProductType}
          maxVisible={FILTER_INITIAL_VISIBLE}
          showMoreLabel={t("games.filters.showMore")}
          showLessLabel={t("games.filters.showLess")}
          scale="lg"
        />

        <MultiSelectFilter
          idPrefix={`${idPrefix}-platform`}
          legend={t("games.filters.platformLabel")}
          options={platformOptions}
          selected={platforms}
          onToggle={togglePlatform}
          maxVisible={FILTER_INITIAL_VISIBLE}
          showMoreLabel={t("games.filters.showMore")}
          showLessLabel={t("games.filters.showLess")}
          scale="lg"
        />

        <MultiSelectFilter
          idPrefix={`${idPrefix}-region`}
          legend={t("games.filters.regionLabel")}
          options={regionOptions}
          selected={regions}
          onToggle={toggleRegion}
          maxVisible={FILTER_INITIAL_VISIBLE}
          showMoreLabel={t("games.filters.showMore")}
          showLessLabel={t("games.filters.showLess")}
          scale="lg"
        />

        <FilterField label={t("games.filters.priceLabel")} htmlFor={`${idPrefix}-price-min`} scale="lg">
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("games.filters.priceLabel")}>
            {PRICE_PRESETS.map((preset) => {
              const active = isPricePresetActive(preset);
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => setPricePreset(active ? { key: "clear", min: "", max: "" } : preset)}
                  aria-pressed={active}
                  className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    active ? "border-primary bg-primary text-white" : "border-border bg-surface-elevated text-foreground hover:bg-surface-hover"
                  }`}
                >
                  {pricePresetLabel(preset, t)}
                </button>
              );
            })}
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <input
              id={`${idPrefix}-price-min`}
              type="number"
              inputMode="decimal"
              min={0}
              placeholder={t("games.filters.priceMin")}
              aria-label={`${t("games.filters.priceLabel")} — ${t("games.filters.priceMin")}`}
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              className="h-11 w-full rounded-full border border-border bg-surface-elevated px-4 text-[15px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
            <span className="text-secondary" aria-hidden="true">
              –
            </span>
            <input
              id={`${idPrefix}-price-max`}
              type="number"
              inputMode="decimal"
              min={0}
              placeholder={t("games.filters.priceMax")}
              aria-label={`${t("games.filters.priceLabel")} — ${t("games.filters.priceMax")}`}
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              className="h-11 w-full rounded-full border border-border bg-surface-elevated px-4 text-[15px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
          </div>
        </FilterField>
      </>
    );
  }

  return (
    <div className="py-10 sm:py-12 lg:py-16">
      <Container>
        <Reveal>
          <h1 className="flex items-center gap-2 text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
            <Search className="h-6 w-6 shrink-0 text-secondary" aria-hidden="true" />
            {query !== "" ? t("search.resultsFor").replace("{query}", query) : t("search.pageTitle")}
          </h1>

          <p className="mt-2 text-sm text-secondary" aria-live="polite">
            {t("marketplace.resultCount").replace("{count}", String(results.length))}
          </p>

          {products.length > 0 ? (
            <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start">
              {/* Step 70 §6/§15: same sticky left filter panel the Games
                  page uses (`lg:sticky lg:top-24` — can't extend past its
                  own content or the footer). Below `lg`, the drawer trigger
                  next to Sort is the only way to reach it, same cutover
                  point as Games (§13's 768/834px must never show a
                  permanent sidebar). */}
              <aside className="hidden shrink-0 lg:sticky lg:top-24 lg:block lg:w-72 xl:w-80">
                <div className="flex flex-col gap-6 rounded-2xl border border-border bg-surface-elevated p-6">
                  {renderFilterFields("search-filter")}
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="w-full"
                  >
                    {t("games.clearFilters")}
                  </Button>
                </div>
              </aside>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:hidden"
                  >
                    <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                    {t("games.filters.filtersButton")}
                    {activeFilterCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  <div className="ml-auto flex items-center gap-2">
                    <label htmlFor="search-sort" className="hidden text-xs font-medium text-secondary sm:block">
                      {t("games.filters.sortLabel")}
                    </label>
                    <Select id="search-sort" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="w-44 sm:w-52">
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
                  {renderFilterFields("search-filter-mobile")}
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
                      className="shrink-0 whitespace-nowrap px-1 text-xs font-medium text-secondary underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {t("games.clearFilters")}
                    </button>
                  </div>
                )}

                {results.length > 0 ? (
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
                    {results.map((product) => (
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
                  // Step 70 §9: filters (not the query) narrowed this to
                  // zero — same shape as the Games page's own filtered-to-
                  // zero state (title + Clear filters, no separate body
                  // copy), but reusing `search.noResultsTitle` rather than
                  // `games.noResultsTitle` since this is a cross-catalog
                  // results page, not a games-only one.
                  <div className="mt-4 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface-elevated px-6 py-16 text-center">
                    <p className="text-base font-semibold text-foreground">{t("search.noResultsTitle")}</p>
                    <Button type="button" variant="secondary" onClick={clearFilters}>
                      {t("games.clearFilters")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface-elevated px-6 py-16 text-center">
              <p className="text-base font-semibold text-foreground">{t("search.noResultsTitle")}</p>
              <p className="max-w-sm text-sm text-secondary">{t("search.noResultsBody")}</p>

              <div className="mt-2 flex flex-col items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  {t("search.browseCategories")}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {browseCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={category.route}
                      prefetch={false}
                      className="rounded-full border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {t(category.nameKey)}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Reveal>
      </Container>
    </div>
  );
}
