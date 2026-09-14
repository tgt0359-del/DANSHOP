"use client";

import { useMemo, useState } from "react";
import { getGameBySlug } from "@/data/games";
import { getProductTypeInfo } from "@/data/productTypes";
import { useLanguage } from "@/hooks/useLanguage";
import { useSearch } from "@/hooks/useSearch";
import { platformTranslationKey } from "@/lib/products/platformLabels";
import { regionTranslationKey } from "@/lib/products/regionLabels";
import { matchesProductQuery } from "@/lib/search/matchesProductQuery";
import { toggleValue } from "@/lib/filters/toggleValue";
import type { Game } from "@/types/game";
import type { Platform, Product, ProductType, Region } from "@/types/product";

export type CategoryFilterValue = "all" | string;
/** Step 55.1/56: Product Type, Platform, and Region are all true
 * multi-selects — an empty array means "no filter" (equivalent to the old
 * `"all"`), any other array means "match ANY of these" (OR within the
 * dimension — see `results` below). Availability/stock was removed as a
 * filter dimension entirely (Step 56 §2): every product in this catalog,
 * real or demo, has `stockStatus: "in_stock"` (see `productAdapter.ts`/
 * `data/demoProducts.ts`), so "Low Stock"/"Out of Stock" could never
 * match anything — a filter section that can never narrow results isn't
 * meaningful, per Step 56's own "remove filters that do not provide
 * meaningful value" instruction. `Product.stockStatus` itself is
 * untouched — the product detail page's stock badge still reads it. */
export type ProductTypeSelection = ProductType[];
export type PlatformSelection = Platform[];
export type RegionSelection = Region[];
/** Step 66 (Games Page Filter UI Refinement) §2 removed the Rating and
 * Discount filter sections entirely — their filter dimensions, chips, and
 * state (`minRating`/`discount`) are gone from this hook, not just hidden
 * in the UI. `"popular"` (§9) replaces the old `"ratingHighLow"` sort
 * option with the same real, honest sort — highest `rating` first, the
 * only real "how well-liked is this" signal the catalog has — just
 * relabeled to match a marketplace's conventional "Popular" sort, not a
 * new/fake ranking. `"discountHighLow"` has no replacement: the step's
 * own requested sort list (Recommended/Popular/Newest/Price Low-High/
 * Price High-Low) doesn't include a discount-based sort. */
export type SortOption = "recommended" | "popular" | "priceLowHigh" | "priceHighLow" | "newest";

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export interface PricePreset {
  key: string;
  /** Empty string means "no bound" — same convention the min/max text
   * inputs already use. */
  min: string;
  max: string;
}

/** Step 55 §1's 4 quick price presets — each just sets the same min/max
 * state the custom inputs already use (no separate filtering logic; see
 * the file comment below). */
export const PRICE_PRESETS: PricePreset[] = [
  { key: "under5", min: "", max: "5" },
  { key: "under10", min: "", max: "10" },
  { key: "10to25", min: "10", max: "25" },
  { key: "25plus", min: "25", max: "" },
];

/**
 * The one place DANSHOP's product catalog is filtered, searched, and
 * sorted (Step 55 §2/§3) — extracted from `GamesCatalog.tsx` (Steps
 * 48–50) so a future page could reuse the exact same filtering behavior
 * without a second, parallel implementation. Every filter combines with
 * AND (Step 48 §3, unchanged, now extended to the Step 54 taxonomy
 * dimensions too — Step 55 §4's worked example: Product Type + Platform +
 * Region + Price all narrow the same result set together).
 *
 * Filtering runs against `Product[]` (Supabase-primary, local-fallback —
 * see `lib/products/productRepository.ts`); rendering still resolves back
 * to `Game[]` by slug purely for display (`GameCard`, procedural artwork,
 * the wishlist button, and `Game`-only sort fields like `releaseDate`) —
 * unchanged from Step 48's original design, see that step's history for
 * why. `getGameBySlug` is a synchronous local lookup, so this whole hook
 * stays synchronous even though the catalog itself may have come from an
 * async Supabase read one level up (`app/games/page.tsx`).
 *
 * State shape note (Step 55 §10 — "create a clean architecture that can
 * later support URL query parameters without breaking the current app"):
 * every filter here is a single, named piece of state (`category`,
 * `minRating`, `discount`, `minPrice`, `maxPrice`, `sort` are strings;
 * `productTypes`/`platforms`/`regions` are string arrays as of Step
 * 55.1/56) plus the shared `query` from `useSearch()` — each maps cleanly
 * onto a plausible URL query parameter (`?type=game,gift-card&
 * platform=PC,Steam&region=Global&minPrice=0&maxPrice=10`). Nothing here
 * reads/writes `URLSearchParams` yet — that's a real, separate change
 * (this step deliberately doesn't make it — "do not over-engineer this
 * step") — but swapping these `useState` calls for a
 * `useSearchParams`-backed equivalent later would not require touching
 * `GamesCatalog.tsx` at all, since it only ever consumes this hook's
 * returned value shape.
 */
export function useProductFilters(products: Product[]) {
  const { t } = useLanguage();
  const { query, setQuery } = useSearch();

  const [category, setCategory] = useState<CategoryFilterValue>("all");
  const [productTypes, setProductTypes] = useState<ProductTypeSelection>([]);
  const [platforms, setPlatforms] = useState<PlatformSelection>([]);
  const [regions, setRegions] = useState<RegionSelection>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortOption>("recommended");

  // Genre options stay dynamically derived from the real catalog (Step 44's
  // original design) rather than a hardcoded list — the same reasoning
  // Step 54's taxonomy work documented for why this needed no change.
  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort((a, b) => a.localeCompare(b)),
    [products]
  );

  // UI-03.5 §4/§7: real per-option product counts, tallied once from the
  // same already-fetched `products` array every other computation here
  // already reads — no new data fetch, no invented numbers. Deliberately a
  // flat, un-cross-filtered count (how many products in the whole catalog
  // have this productType/region at all) rather than one that recomputes
  // against the *other* currently-active filters — the simpler, standard
  // "how much does picking this option even mean" signal, and the only one
  // that stays stable while a user is mid-way through selecting several
  // checkboxes in the same group (a live cross-filtered count would make
  // already-checked siblings' own numbers shift under the user's cursor).
  const productTypeCounts = useMemo(() => {
    const counts: Partial<Record<ProductType, number>> = {};
    for (const product of products) {
      counts[product.productType] = (counts[product.productType] ?? 0) + 1;
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

  // UI-03.7 §8: same real, flat-tally approach as `productTypeCounts`/
  // `regionCounts` above, extended to Platform — the one dimension this
  // page's own count display was deliberately left without in UI-03.2
  // (§8 back then said "do not add unrelated Platform features"); this
  // step explicitly asks for it now.
  const platformCounts = useMemo(() => {
    const counts: Partial<Record<Platform, number>> = {};
    for (const product of products) {
      counts[product.platform] = (counts[product.platform] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  /** Toggles one Product Type in/out of the current multi-select (Step
   * 55.1 §1/§3) — reuses the same generic add/remove logic Platform/Region
   * now also use (Step 56), via `toggleValue`. */
  function toggleProductType(type: ProductType) {
    setProductTypes((current) => toggleValue(current, type));
  }

  /** Removes a single Product Type from the selection — what each
   * individual chip's × button calls (Step 55.1 §5): removing "DLC" must
   * leave "Games"/"Gift Cards" selected, exactly like `toggleProductType`
   * called on an already-selected value, just spelled out for clarity at
   * the chip call site. */
  function removeProductType(type: ProductType) {
    setProductTypes((current) => current.filter((value) => value !== type));
  }

  /** Step 56: Platform becomes a true multi-select, mirroring Product
   * Type's toggle/remove pair exactly. */
  function togglePlatform(value: Platform) {
    setPlatforms((current) => toggleValue(current, value));
  }

  function removePlatform(value: Platform) {
    setPlatforms((current) => current.filter((item) => item !== value));
  }

  /** Step 56: Region becomes a true multi-select, same pattern. */
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
    query.trim() !== "" ||
    category !== "all" ||
    productTypes.length > 0 ||
    platforms.length > 0 ||
    regions.length > 0 ||
    minPrice !== "" ||
    maxPrice !== "" ||
    sort !== "recommended";

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setProductTypes([]);
    setPlatforms([]);
    setRegions([]);
    setMinPrice("");
    setMaxPrice("");
    setSort("recommended");
  }

  /** Active Filter Chips (Step 49, extended Step 55) — one per active
   * search/filter, each independently removable (§5). `sort` is
   * deliberately excluded, same reasoning as Step 49: a chip represents a
   * narrowing condition, and sort doesn't narrow anything. */
  const chips = useMemo<FilterChip[]>(() => {
    const list: FilterChip[] = [];

    if (query.trim() !== "") {
      list.push({ key: "search", label: `${t("games.filters.searchLabel")}: "${query.trim()}"`, onRemove: () => setQuery("") });
    }
    if (category !== "all") {
      list.push({ key: "category", label: `${t("games.filters.categoryLabel")}: ${category}`, onRemove: () => setCategory("all") });
    }
    // Step 55.1 §5: one independently-removable chip PER selected Product
    // Type (not one combined chip) — "Games ×" and "Gift Cards ×" are two
    // separate chips, each removing only its own value.
    for (const type of productTypes) {
      const info = getProductTypeInfo(type);
      list.push({
        key: `productType-${type}`,
        label: `${t("games.filters.productTypeLabel")}: ${info ? t(info.translationKey) : type}`,
        onRemove: () => removeProductType(type),
      });
    }
    // Step 56: one independently-removable chip per selected Platform,
    // same "OR-within-dimension, one chip each" pattern as Product Type.
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
  }, [t, query, setQuery, category, productTypes, platforms, regions, minPrice, maxPrice]);

  // Step 50 §7: search has its own visible input, so it's excluded from
  // the mobile "Filters" button's count to avoid double-counting.
  const activeFilterCount = chips.filter((chip) => chip.key !== "search").length;

  const results = useMemo(() => {
    const min = minPrice.trim() === "" ? null : Number(minPrice);
    const max = maxPrice.trim() === "" ? null : Number(maxPrice);

    // Step 48 §3 / Step 55 §4: every condition below combines with AND — a
    // product must pass every active filter, not just one of them.
    const filteredProducts = products.filter((product) => {
      // Step 62: shared with the header suggestions and the /search
      // results page — also checks `region`/product type now, so "gift"
      // finds every gift-card-type product here too, not just ones whose
      // name happens to say "Gift" (see that helper's own comment).
      const matchesQuery = matchesProductQuery(product, query);
      const matchesCategory = category === "all" || product.category === category;
      // Step 55.1/56 §5: empty selection = no filter; otherwise OR within
      // each dimension — a product matching ANY selected value passes.
      // Across dimensions, every condition still combines with AND.
      const matchesProductType = productTypes.length === 0 || productTypes.includes(product.productType);
      const matchesPlatform = platforms.length === 0 || platforms.includes(product.platform);
      const matchesRegion = regions.length === 0 || regions.includes(product.region);
      const matchesMinPrice = min === null || Number.isNaN(min) || product.price >= min;
      const matchesMaxPrice = max === null || Number.isNaN(max) || product.price <= max;

      return (
        matchesQuery &&
        matchesCategory &&
        matchesProductType &&
        matchesPlatform &&
        matchesRegion &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });

    // Rendering still goes through the real `Game` data — see file comment.
    const filteredGames = filteredProducts
      .map((product) => getGameBySlug(product.slug))
      .filter((game): game is Game => game !== undefined);

    switch (sort) {
      case "priceLowHigh":
        return [...filteredGames].sort((a, b) => a.price - b.price);
      case "priceHighLow":
        return [...filteredGames].sort((a, b) => b.price - a.price);
      case "popular":
        // Step 66 §9: "Popular" — the same real, honest sort the old
        // "Rating: High to Low" sort option used (highest `rating` first),
        // just relabeled to match a marketplace's conventional naming; see
        // this file's `SortOption` comment for why this isn't new/fake logic.
        return [...filteredGames].sort((a, b) => b.rating - a.rating);
      case "newest":
        return [...filteredGames].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
      case "recommended":
      default:
        // Keep the existing data order — no reliable "recommended" ranking
        // exists, so this is just the catalog's natural, unmodified order.
        return filteredGames;
    }
  }, [products, query, category, productTypes, platforms, regions, minPrice, maxPrice, sort]);

  return {
    query,
    setQuery,
    category,
    setCategory,
    categories,
    productTypeCounts,
    regionCounts,
    productTypes,
    toggleProductType,
    removeProductType,
    platforms,
    togglePlatform,
    removePlatform,
    platformCounts,
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

export type ProductFilters = ReturnType<typeof useProductFilters>;
