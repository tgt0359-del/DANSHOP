"use client";

import { useMemo, useState } from "react";
import { getGiftCardKind, giftCardCategories } from "@/data/giftCardMeta";
import { useLanguage } from "@/hooks/useLanguage";
import { toggleValue } from "@/lib/filters/toggleValue";
import { platformTranslationKey } from "@/lib/products/platformLabels";
import { regionTranslationKey } from "@/lib/products/regionLabels";
import { matchesSearchQuery } from "@/lib/search/matchesSearchQuery";
import type { GiftCardKind } from "@/types/giftCard";
import type { Platform, Product, Region } from "@/types/product";

/** Step 59 §3's 4 price buckets — deliberately non-overlapping (unlike the
 * Games page's "Under $5"/"Under $10" preset pair, Step 55/56), so more
 * than one can be meaningfully selected at once (OR'd together) the same
 * way the other 3 checkbox dimensions on this page already work. */
export type PriceBucket = "under5" | "5to10" | "10to25" | "25plus";

/** Exported (Step 60) so the Digital Wallets marketplace's own
 * `useWalletFilters` reuses this exact bucketing instead of a duplicated
 * copy — it isn't gift-card-specific, just generic USD price ranges. */
export const PRICE_BUCKET_TEST: Record<PriceBucket, (price: number) => boolean> = {
  under5: (price) => price < 5,
  "5to10": (price) => price >= 5 && price < 10,
  "10to25": (price) => price >= 10 && price < 25,
  "25plus": (price) => price >= 25,
};

export const PRICE_BUCKET_LABEL_KEY: Record<PriceBucket, string> = {
  under5: "giftCards.filters.priceUnder5",
  "5to10": "giftCards.filters.price5to10",
  "10to25": "giftCards.filters.price10to25",
  "25plus": "giftCards.filters.price25plus",
};

/** No "Discount: High to Low" here (unlike the Games page's sort list,
 * Step 55/56) — every Gift Card marketplace product's own `Product.price`/
 * `isOnSale` is never discounted (discounts only ever exist at the
 * denomination/variant level, Step 57's "parent price is the lowest
 * variant's price, discounts shown only at the variant level" convention)
 * — a sort key that would tie every single result isn't meaningful. */
export type GiftCardSortOption = "recommended" | "priceLowHigh" | "priceHighLow" | "ratingHighLow" | "newest";

export interface GiftCardFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * Filtering/search/sort for the Gift Card marketplace (Step 59 §2/§3) —
 * mirrors `useProductFilters.ts`'s architecture (multi-select checkbox
 * dimensions via the shared `toggleValue`, one independently-removable
 * chip per selection, a single `clearFilters`) but works directly on
 * `Product[]` and renders via `CategoryProductCard`, not `Game[]`/
 * `GameCard` — this page's catalog is 100% demo/wallet-template products
 * with no real-game counterpart, so there is no `getGameBySlug` resolution
 * step to reuse from that hook. Every filter combines with AND; within one
 * dimension, multiple selections combine with OR (Step 56's precedent).
 */
export function useGiftCardFilters(products: Product[]) {
  const { t } = useLanguage();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [kinds, setKinds] = useState<GiftCardKind[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [priceBuckets, setPriceBuckets] = useState<PriceBucket[]>([]);
  const [sort, setSort] = useState<GiftCardSortOption>("recommended");

  function toggleKind(value: GiftCardKind) {
    setKinds((current) => toggleValue(current, value));
  }
  function removeKind(value: GiftCardKind) {
    setKinds((current) => current.filter((item) => item !== value));
  }

  function togglePlatform(value: Platform) {
    setPlatforms((current) => toggleValue(current, value));
  }
  function removePlatform(value: Platform) {
    setPlatforms((current) => current.filter((item) => item !== value));
  }

  function toggleRegion(value: Region) {
    setRegions((current) => toggleValue(current, value));
  }
  function removeRegion(value: Region) {
    setRegions((current) => current.filter((item) => item !== value));
  }

  function togglePriceBucket(value: PriceBucket) {
    setPriceBuckets((current) => toggleValue(current, value));
  }
  function removePriceBucket(value: PriceBucket) {
    setPriceBuckets((current) => current.filter((item) => item !== value));
  }

  // UI-03.5 §6/§7: real per-option product counts, tallied once from the
  // already-fetched `products` array — no new fetch, no invented numbers.
  // Same flat (not cross-filtered) approach as `useProductFilters.ts`'s
  // own `productTypeCounts`/`regionCounts` — see that hook's comment for
  // why. `categoryCounts` is keyed by the raw `product.category` string
  // (the same field `giftCardCategories`' own `value` matches against, see
  // `data/giftCardMeta.ts`), not by a `GiftCardCategory` object.
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const product of products) {
      counts[product.category] = (counts[product.category] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  const regionCounts = useMemo(() => {
    const counts: Partial<Record<Region, number>> = {};
    for (const product of products) {
      counts[product.region] = (counts[product.region] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  // UI-03.6 §3/§4: same real, flat-tally approach as `categoryCounts`/
  // `regionCounts` above, extended to the two remaining checkbox groups
  // this page has — Product Type ("Kind": Gift Card/Gaming Gift Card/
  // Wallet/Subscription) and Platform. `kindCounts` is keyed by
  // `GiftCardKind`, resolved the same way `results` above already
  // resolves it per product (`getGiftCardKind(product.id)`) — a product
  // with no known kind contributes to neither count, same as it already
  // can't match any `kinds` filter selection either.
  const kindCounts = useMemo(() => {
    const counts: Partial<Record<GiftCardKind, number>> = {};
    for (const product of products) {
      const kind = getGiftCardKind(product.id);
      if (kind === undefined) continue;
      counts[kind] = (counts[kind] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  const platformCounts = useMemo(() => {
    const counts: Partial<Record<Platform, number>> = {};
    for (const product of products) {
      counts[product.platform] = (counts[product.platform] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  const hasActiveFilters =
    query.trim() !== "" ||
    category !== null ||
    kinds.length > 0 ||
    platforms.length > 0 ||
    regions.length > 0 ||
    priceBuckets.length > 0 ||
    sort !== "recommended";

  function clearFilters() {
    setQuery("");
    setCategory(null);
    setKinds([]);
    setPlatforms([]);
    setRegions([]);
    setPriceBuckets([]);
    setSort("recommended");
  }

  const chips = useMemo<GiftCardFilterChip[]>(() => {
    const list: GiftCardFilterChip[] = [];

    if (query.trim() !== "") {
      list.push({ key: "search", label: `${t("games.filters.searchLabel")}: "${query.trim()}"`, onRemove: () => setQuery("") });
    }
    if (category !== null) {
      const categoryLabelKey = giftCardCategories.find((entry) => entry.value === category)?.labelKey;
      list.push({
        key: "category",
        label: `${t("games.filters.categoryLabel")}: ${categoryLabelKey ? t(categoryLabelKey) : category}`,
        onRemove: () => setCategory(null),
      });
    }
    for (const kind of kinds) {
      list.push({
        key: `kind-${kind}`,
        label: `${t("games.filters.productTypeLabel")}: ${t(`giftCards.kind.${kind}`)}`,
        onRemove: () => removeKind(kind),
      });
    }
    for (const value of platforms) {
      list.push({
        key: `platform-${value}`,
        label: `${t("games.filters.platformLabel")}: ${t(platformTranslationKey[value])}`,
        onRemove: () => removePlatform(value),
      });
    }
    for (const value of regions) {
      list.push({
        key: `region-${value}`,
        label: `${t("games.filters.regionLabel")}: ${t(regionTranslationKey[value])}`,
        onRemove: () => removeRegion(value),
      });
    }
    for (const bucket of priceBuckets) {
      list.push({
        key: `price-${bucket}`,
        label: `${t("games.filters.priceLabel")}: ${t(PRICE_BUCKET_LABEL_KEY[bucket])}`,
        onRemove: () => removePriceBucket(bucket),
      });
    }

    return list;
  }, [t, query, category, kinds, platforms, regions, priceBuckets]);

  const activeFilterCount = chips.filter((chip) => chip.key !== "search").length;

  const results = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesQuery = matchesSearchQuery(
        [product.name, product.slug, product.description, product.shortDescription, product.category, product.platform],
        query
      );
      const matchesCategory = category === null || product.category === category;
      const kind = getGiftCardKind(product.id);
      const matchesKind = kinds.length === 0 || (kind !== undefined && kinds.includes(kind));
      const matchesPlatform = platforms.length === 0 || platforms.includes(product.platform);
      const matchesRegion = regions.length === 0 || regions.includes(product.region);
      const matchesPrice = priceBuckets.length === 0 || priceBuckets.some((bucket) => PRICE_BUCKET_TEST[bucket](product.price));

      return matchesQuery && matchesCategory && matchesKind && matchesPlatform && matchesRegion && matchesPrice;
    });

    switch (sort) {
      case "priceLowHigh":
        return [...filtered].sort((a, b) => a.price - b.price);
      case "priceHighLow":
        return [...filtered].sort((a, b) => b.price - a.price);
      case "ratingHighLow":
        return [...filtered].sort((a, b) => b.rating - a.rating);
      case "newest":
        return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "recommended":
      default:
        return filtered;
    }
  }, [products, query, category, kinds, platforms, regions, priceBuckets, sort]);

  return {
    query,
    setQuery,
    category,
    setCategory,
    categoryCounts,
    kinds,
    toggleKind,
    removeKind,
    kindCounts,
    platforms,
    togglePlatform,
    removePlatform,
    platformCounts,
    regions,
    toggleRegion,
    removeRegion,
    regionCounts,
    priceBuckets,
    togglePriceBucket,
    removePriceBucket,
    sort,
    setSort,
    results,
    chips,
    activeFilterCount,
    hasActiveFilters,
    clearFilters,
  };
}
