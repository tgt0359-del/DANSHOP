"use client";

import { useMemo, useState } from "react";
import { getGiftCardKind } from "@/data/giftCardMeta";
import { useLanguage } from "@/hooks/useLanguage";
import { PRICE_BUCKET_LABEL_KEY, PRICE_BUCKET_TEST, type PriceBucket } from "@/hooks/useGiftCardFilters";
import { toggleValue } from "@/lib/filters/toggleValue";
import { platformTranslationKey } from "@/lib/products/platformLabels";
import { regionTranslationKey } from "@/lib/products/regionLabels";
import { getWalletGroup, walletGroups, type WalletGroup } from "@/lib/products/walletGroups";
import { matchesSearchQuery } from "@/lib/search/matchesSearchQuery";
import type { GiftCardKind } from "@/types/giftCard";
import type { Platform, Product, Region } from "@/types/product";

export type WalletSortOption = "recommended" | "priceLowHigh" | "priceHighLow" | "ratingHighLow" | "newest";

export interface WalletFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * Filtering/search/sort for the Digital Wallets marketplace (Step 60) —
 * structurally identical to `useGiftCardFilters.ts` (Step 59: multi-select
 * checkbox dimensions via the shared `toggleValue`, one independently-
 * removable chip per selection, a single `clearFilters`), reusing that
 * hook's `PriceBucket`/`PRICE_BUCKET_TEST`/`PRICE_BUCKET_LABEL_KEY` and
 * `giftCardMeta.ts`'s `GiftCardKind`/`getGiftCardKind` directly rather than
 * duplicating them — genuinely the same "price range"/"product type"
 * concepts, just applied to a different product set. The one real
 * difference is the top-level grouping: this page groups by the 4 named
 * wallet families (`WalletGroup`, `lib/products/walletGroups.ts`) instead
 * of the Gift Card marketplace's 10 finer categories — different enough
 * (a computed group, not a stored `Product.category` string) that it
 * isn't worth forcing both pages through one over-parameterized hook.
 */
export function useWalletFilters(products: Product[]) {
  const { t } = useLanguage();

  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<WalletGroup | null>(null);
  const [kinds, setKinds] = useState<GiftCardKind[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [priceBuckets, setPriceBuckets] = useState<PriceBucket[]>([]);
  const [sort, setSort] = useState<WalletSortOption>("recommended");

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

  const hasActiveFilters =
    query.trim() !== "" ||
    group !== null ||
    kinds.length > 0 ||
    platforms.length > 0 ||
    regions.length > 0 ||
    priceBuckets.length > 0 ||
    sort !== "recommended";

  function clearFilters() {
    setQuery("");
    setGroup(null);
    setKinds([]);
    setPlatforms([]);
    setRegions([]);
    setPriceBuckets([]);
    setSort("recommended");
  }

  const chips = useMemo<WalletFilterChip[]>(() => {
    const list: WalletFilterChip[] = [];

    if (query.trim() !== "") {
      list.push({ key: "search", label: `${t("games.filters.searchLabel")}: "${query.trim()}"`, onRemove: () => setQuery("") });
    }
    if (group !== null) {
      const groupLabelKey = walletGroups.find((entry) => entry.value === group)?.labelKey;
      list.push({
        key: "group",
        label: `${t("games.filters.categoryLabel")}: ${groupLabelKey ? t(groupLabelKey) : group}`,
        onRemove: () => setGroup(null),
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
  }, [t, query, group, kinds, platforms, regions, priceBuckets]);

  const activeFilterCount = chips.filter((chip) => chip.key !== "search").length;

  const results = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesQuery = matchesSearchQuery(
        [product.name, product.slug, product.description, product.shortDescription, product.category, product.platform],
        query
      );
      const matchesGroup = group === null || getWalletGroup(product) === group;
      const kind = getGiftCardKind(product.id);
      const matchesKind = kinds.length === 0 || (kind !== undefined && kinds.includes(kind));
      const matchesPlatform = platforms.length === 0 || platforms.includes(product.platform);
      const matchesRegion = regions.length === 0 || regions.includes(product.region);
      const matchesPrice = priceBuckets.length === 0 || priceBuckets.some((bucket) => PRICE_BUCKET_TEST[bucket](product.price));

      return matchesQuery && matchesGroup && matchesKind && matchesPlatform && matchesRegion && matchesPrice;
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
  }, [products, query, group, kinds, platforms, regions, priceBuckets, sort]);

  return {
    query,
    setQuery,
    group,
    setGroup,
    kinds,
    toggleKind,
    removeKind,
    platforms,
    togglePlatform,
    removePlatform,
    regions,
    toggleRegion,
    removeRegion,
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
