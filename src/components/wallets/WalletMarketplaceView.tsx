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
import { getMarketplaceCategoryBySlug } from "@/data/marketplaceCategories";
import { hasVariants } from "@/data/productVariants";
import { useLanguage } from "@/hooks/useLanguage";
import { PRICE_BUCKET_LABEL_KEY, type PriceBucket } from "@/hooks/useGiftCardFilters";
import { useWalletFilters } from "@/hooks/useWalletFilters";
import { cn } from "@/lib/cn";
import { platformTranslationKey } from "@/lib/products/platformLabels";
import { regionTranslationKey } from "@/lib/products/regionLabels";
import { walletGroups } from "@/lib/products/walletGroups";
import type { GiftCardKind } from "@/types/giftCard";
import type { Platform, Product, Region } from "@/types/product";

const KIND_OPTIONS: GiftCardKind[] = ["gift-card", "gaming-gift-card", "wallet", "subscription"];
const PLATFORM_OPTIONS: Platform[] = ["Steam", "PlayStation", "Xbox", "Nintendo", "Google Play", "Apple", "Roblox", "Garena", "Other"];
const REGION_OPTIONS: Region[] = ["Global", "Thailand", "Laos", "United States", "Europe", "Other"];
const PRICE_BUCKET_OPTIONS: PriceBucket[] = ["under5", "5to10", "10to25", "25plus"];

/**
 * The Digital Wallets marketplace (Step 60) — Steam Wallet, Console
 * Wallets (PlayStation/Xbox/Nintendo), Mobile/App Wallets (Google Play/
 * Apple), and Gaming Credits (Roblox/Garena/other), organized behind the
 * same search/group-chips/checkbox-filter-panel/sort/Recently-Viewed shape
 * `GiftCardMarketplaceView.tsx` (Step 59) already established — deliberately
 * mirrored rather than reworked, per "use the existing checkbox filter/chip
 * architecture." `products` is prepared by `app/wallets/page.tsx`: every
 * demo product `lib/products/walletGroups.ts`'s `getWalletGroup` resolves
 * to one of the 4 groups, all of which have real denominations and a
 * genuine `/product/<slug>` detail page (Step 57) — so, like the Gift Card
 * marketplace, every card here is interactive except the handful of
 * generic demo placeholders with no denominations, which keep the
 * existing "Demo" badge/non-clickable treatment.
 */
export function WalletMarketplaceView({ products }: { products: Product[] }) {
  const { t } = useLanguage();
  const filters = useWalletFilters(products);
  const {
    query,
    setQuery,
    group,
    setGroup,
    kinds,
    toggleKind,
    platforms,
    togglePlatform,
    regions,
    toggleRegion,
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
  // `CategoryTypeView`/`TopUpLandingView`/`GiftCardMarketplaceView` already
  // read, for the same icon-circle + "Back to Home" header treatment every
  // other category page uses.
  const pageCategory = getMarketplaceCategoryBySlug("wallets");
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
        />
        <MultiSelectFilter<Platform>
          idPrefix={`${idPrefix}-platform`}
          legend={t("games.filters.platformLabel")}
          options={platformOptions}
          selected={platforms}
          onToggle={togglePlatform}
        />
        <MultiSelectFilter<Region>
          idPrefix={`${idPrefix}-region`}
          legend={t("games.filters.regionLabel")}
          options={regionOptions}
          selected={regions}
          onToggle={toggleRegion}
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
            className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
              <h1 className="text-2xl font-semibold leading-snug text-foreground sm:text-3xl">{t("wallets.pageTitle")}</h1>
              <p className="text-sm text-secondary">{t("wallets.pageDescription")}</p>
            </div>
          </div>

          <RecentlyViewed />

          <div className="relative mt-6 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("wallets.searchPlaceholder")}
              aria-label={t("wallets.searchPlaceholder")}
              className="h-11 w-full rounded-full border border-border bg-surface-elevated pl-10 pr-4 text-sm text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
          </div>

          {!isSearching && popularProducts.length > 0 && (
            <section aria-labelledby="wallets-popular-heading" className="mt-8">
              <h2 id="wallets-popular-heading" className="text-lg font-semibold leading-snug text-foreground">
                {t("wallets.popularTitle")}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {popularProducts.map((product) => (
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
          )}

          <section aria-labelledby="wallets-groups-heading" className="mt-8">
            <h2 id="wallets-groups-heading" className="text-lg font-semibold leading-snug text-foreground">
              {t("wallets.groupsTitle")}
            </h2>
            <div role="group" aria-labelledby="wallets-groups-heading" className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setGroup(null)}
                aria-pressed={group === null}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  group === null
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface-elevated text-foreground hover:border-border-strong"
                )}
              >
                {t("wallets.groupAll")}
              </button>
              {walletGroups.map((entry) => {
                const selected = group === entry.value;
                return (
                  <button
                    key={entry.value}
                    type="button"
                    onClick={() => setGroup(entry.value)}
                    aria-pressed={selected}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      selected
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-surface-elevated text-foreground hover:border-border-strong"
                    )}
                  >
                    {t(entry.labelKey)}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Desktop filter sidebar, always visible at lg (1024px) and up —
                same cutover point GamesCatalog/GiftCardMarketplaceView use. */}
            <aside className="hidden shrink-0 lg:block lg:w-64 xl:w-72">
              <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface-elevated p-5">
                {renderFilterFields("wallet-filter")}
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
                  <label htmlFor="wallets-sort" className="hidden text-xs font-medium text-secondary sm:block">
                    {t("games.filters.sortLabel")}
                  </label>
                  <Select id="wallets-sort" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="w-44 sm:w-52">
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
                {renderFilterFields("wallet-filter-mobile")}
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

              <p className="mt-4 text-sm text-secondary" aria-live="polite">
                {t("marketplace.resultCount").replace("{count}", String(results.length))}
              </p>

              {results.length > 0 ? (
                // UI-04: matches this page's own "Popular Wallets" grid
                // above (also `lg:grid-cols-4`) — same sidebar-adjusted
                // content width on this page, so both sections switch to 4
                // columns at the same breakpoint instead of disagreeing
                // between `lg` and `xl`.
                <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
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
                <div className="mt-4 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface-elevated px-6 py-16 text-center">
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
