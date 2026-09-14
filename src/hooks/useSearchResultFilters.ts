"use client";

import { useMemo, useState } from "react";
import { getProductTypeInfo } from "@/data/productTypes";
import { useLanguage } from "@/hooks/useLanguage";
import { PRICE_PRESETS, type PricePreset } from "@/hooks/useProductFilters";
import { platformTranslationKey } from "@/lib/products/platformLabels";
import { regionTranslationKey } from "@/lib/products/regionLabels";
import { toggleValue } from "@/lib/filters/toggleValue";
import type { Platform, Product, ProductType, Region } from "@/types/product";

export type SearchSortOption = "recommended" | "priceLowHigh" | "priceHighLow" | "ratingHighLow" | "newest";

export interface SearchFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * Filtering/sorting for the `/search` results page (Step 70 §6/§7) —
 * narrows the `products` already matched against the query (Step 62's
 * `matchesProductQuery`, run once server-side in `app/search/page.tsx`) by
 * Product Type/Platform/Region/Price, and sorts the result. Reuses the
 * exact same multi-select "OR within a dimension, AND across dimensions"
 * rule, the same `PRICE_PRESETS`, and the same `MultiSelectFilter`/
 * `FilterChip`/`MobileFilterDrawer` UI the Games page's `useProductFilters`
 * already established (Step 55/55.1/56/66) — not a second filtering
 * design, just this page's own instance of it.
 *
 * Deliberately a separate hook rather than calling `useProductFilters`
 * directly: that hook's `results` resolves back to real `Game[]` for
 * `GameCard` rendering (see its own file comment) — every demo product
 * (every Gift Card/Steam Wallet/Top-Up/DLC listing, i.e. most of what a
 * cross-catalog search actually returns) has no `Game` counterpart and
 * would silently disappear from the results if run through that
 * resolution step. This hook stays in `Product[]` end to end, matching
 * what `CategoryProductCard` (the card this page already renders, Step 62)
 * actually needs — and has no `query`/`category` state of its own: the
 * query match already happened server-side (this only narrows further),
 * and "Category" isn't one of this step's four listed filter dimensions
 * (Product Type/Platform/Region/Price) nor a concept that applies evenly
 * across every product type the way it does for games alone.
 */
export function useSearchResultFilters(products: Product[]) {
  const { t } = useLanguage();

  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SearchSortOption>("recommended");

  function toggleProductType(type: ProductType) {
    setProductTypes((current) => toggleValue(current, type));
  }
  function removeProductType(type: ProductType) {
    setProductTypes((current) => current.filter((value) => value !== type));
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

  function setPricePreset(preset: PricePreset) {
    setMinPrice(preset.min);
    setMaxPrice(preset.max);
  }
  function isPricePresetActive(preset: PricePreset): boolean {
    return (preset.min !== "" || preset.max !== "") && minPrice === preset.min && maxPrice === preset.max;
  }

  const hasActiveFilters =
    productTypes.length > 0 ||
    platforms.length > 0 ||
    regions.length > 0 ||
    minPrice !== "" ||
    maxPrice !== "" ||
    sort !== "recommended";

  function clearFilters() {
    setProductTypes([]);
    setPlatforms([]);
    setRegions([]);
    setMinPrice("");
    setMaxPrice("");
    setSort("recommended");
  }

  // One independently-removable chip per active filter (same pattern as
  // `useProductFilters`'s `chips` — see that file for why `sort` is
  // excluded: it re-orders results, it doesn't narrow them).
  const chips = useMemo<SearchFilterChip[]>(() => {
    const list: SearchFilterChip[] = [];

    for (const type of productTypes) {
      const info = getProductTypeInfo(type);
      list.push({
        key: `productType-${type}`,
        label: `${t("games.filters.productTypeLabel")}: ${info ? t(info.translationKey) : type}`,
        onRemove: () => removeProductType(type),
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
    if (minPrice !== "" || maxPrice !== "") {
      const priceText =
        minPrice !== "" && maxPrice !== ""
          ? `$${minPrice}–$${maxPrice}`
          : minPrice !== ""
            ? `≥ $${minPrice}`
            : `≤ $${maxPrice}`;
      list.push({
        key: "price",
        label: `${t("games.filters.priceLabel")}: ${priceText}`,
        onRemove: () => {
          setMinPrice("");
          setMaxPrice("");
        },
      });
    }

    return list;
  }, [t, productTypes, platforms, regions, minPrice, maxPrice]);

  const activeFilterCount = chips.length;

  const results = useMemo(() => {
    const min = minPrice.trim() === "" ? null : Number(minPrice);
    const max = maxPrice.trim() === "" ? null : Number(maxPrice);

    // Step 48 §3 / Step 55 §4's rule, unchanged: every active condition
    // combines with AND; within one dimension (Product Type/Platform/
    // Region), an empty selection means "no filter", otherwise a product
    // matching ANY selected value passes (OR).
    const filtered = products.filter((product) => {
      const matchesProductType = productTypes.length === 0 || productTypes.includes(product.productType);
      const matchesPlatform = platforms.length === 0 || platforms.includes(product.platform);
      const matchesRegion = regions.length === 0 || regions.includes(product.region);
      const matchesMinPrice = min === null || Number.isNaN(min) || product.price >= min;
      const matchesMaxPrice = max === null || Number.isNaN(max) || product.price <= max;

      return matchesProductType && matchesPlatform && matchesRegion && matchesMinPrice && matchesMaxPrice;
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
  }, [products, productTypes, platforms, regions, minPrice, maxPrice, sort]);

  return {
    productTypes,
    toggleProductType,
    removeProductType,
    platforms,
    togglePlatform,
    removePlatform,
    regions,
    toggleRegion,
    removeRegion,
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
  };
}

export { PRICE_PRESETS };
export type { PricePreset };
