"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { GameCard } from "@/components/ui/GameCard";
import { IconButton } from "@/components/ui/IconButton";
import { MobileFilterDrawer } from "@/components/games/MobileFilterDrawer";
import { MultiSelectFilter } from "@/components/games/MultiSelectFilter";
import { Reveal } from "@/components/ui/Reveal";
import { games, getTrendingGames } from "@/data/games";
import { getProductTypes } from "@/data/productTypes";
import { useLanguage } from "@/hooks/useLanguage";
import { PRICE_PRESETS, useProductFilters, type PricePreset } from "@/hooks/useProductFilters";
import { cn } from "@/lib/cn";
import { platformTranslationKey } from "@/lib/products/platformLabels";
import { regionTranslationKey } from "@/lib/products/regionLabels";
import type { Platform, Product, ProductType, Region } from "@/types/product";

// Step 70 §6: exported so the /search results page's own filter panel
// (`useSearchResultFilters.ts`/`SearchResultsView.tsx`) reuses this exact
// option list instead of a second, hand-copied one — one source of truth
// for "which Platform/Region values the filter UI offers", same as every
// other shared piece this file already exports (`FilterField`,
// `FilterChip`).
export const PLATFORM_OPTIONS: Platform[] = [
  "PC",
  "Mobile",
  "Console",
  "PC & Mobile",
  "Cross-platform",
  "Steam",
  "PlayStation",
  "Xbox",
  "Nintendo",
];
// Step 66 §5: keeps every region Step 56 already offered and adds the
// requested "popular digital-goods regions" (Japan/South Korea/Turkey) —
// every one still honestly matches zero real products today (see
// `types/product.ts`'s `Region` doc comment), exactly like Thailand/Laos/
// Europe/Asia already did before this step.
export const REGION_OPTIONS: Region[] = [
  "Global",
  "Thailand",
  "Laos",
  "United States",
  "Japan",
  "South Korea",
  "Turkey",
  "Europe",
  "Asia",
];
// Step 66 §1/§3/§4/§5: every multi-select filter group now shows its
// first 6 options with a "Show more"/"Show less" toggle for the rest,
// instead of a scrolling viewport — see MultiSelectFilter's own comment
// for why it no longer has an internal scrollbar at all.
const FILTER_INITIAL_VISIBLE = 6;

/**
 * Trending Games scroll state: a pure, module-level calculation (not a
 * closure over component state) so it can be called identically from the
 * row's own `onScroll` handler, a `resize` listener, and right after a
 * button-triggered smooth scroll — without any `useCallback`/exhaustive-
 * deps friction. `widthPercent`/`leftPercent` drive the progress
 * indicator below the row (`widthPercent` is the visible-vs-total ratio,
 * floored at 8% so the thumb never shrinks to invisible; `leftPercent` is
 * where it sits along the track). `canScrollLeft`/`canScrollRight` drive
 * the Previous/Next buttons' disabled state. All four numbers come from
 * the same real `scrollLeft`/`scrollWidth`/`clientWidth` read, so they can
 * never drift out of sync with each other or with what caused the scroll
 * (drag, trackpad, touch swipe, keyboard, or the Previous/Next buttons —
 * this function doesn't know or care which one happened, it only reads
 * where the container actually is right now).
 */
function computeTrendingScrollState(el: HTMLDivElement): {
  widthPercent: number;
  leftPercent: number;
  canScrollLeft: boolean;
  canScrollRight: boolean;
} {
  const { scrollLeft, scrollWidth, clientWidth } = el;
  if (scrollWidth <= 0) return { widthPercent: 100, leftPercent: 0, canScrollLeft: false, canScrollRight: false };
  const widthPercent = Math.max(8, Math.min(100, (clientWidth / scrollWidth) * 100));
  const maxScroll = scrollWidth - clientWidth;
  const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollLeft / maxScroll)) : 0;
  // A small tolerance (1px) absorbs sub-pixel rounding so the last card
  // reliably reads as "at the end" instead of leaving Next enabled forever.
  return {
    widthPercent,
    leftPercent: progress * (100 - widthPercent),
    canScrollLeft: scrollLeft > 1,
    canScrollRight: scrollLeft < maxScroll - 1,
  };
}

/** Small label + control pairing, reused for each filter so every one gets a real associated `<label>`.
 * Exported (Step 59) so the Gift Card marketplace's own filter panel reuses this exact control
 * instead of a duplicated copy.
 *
 * `scale` (Step 66 §6): same opt-in-only sizing seam as `MultiSelectFilter`
 * — defaults to the original label size for every existing call site
 * (Gift Cards/Wallets included); only `GamesCatalog` passes `"lg"`.
 * UI-03.3: the `lg` branch's heading typography now matches
 * `MultiSelectFilter`'s own `lg` legend exactly (same size/weight/color),
 * so the sidebar's Price section reads at the same visual level as
 * Product Type/Platform/Region above it — the `default` branch (Gift
 * Cards/Wallets) is untouched. */
export function FilterField({
  label,
  htmlFor,
  children,
  scale = "default",
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  scale?: "default" | "lg";
}) {
  return (
    <div className={cn("flex flex-col", scale === "lg" ? "gap-2.5" : "gap-1.5")}>
      <label
        htmlFor={htmlFor}
        className={cn(scale === "lg" ? "text-base font-bold text-foreground" : "text-xs font-medium text-secondary")}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

// Step 66 §6: slightly larger than the site's default h-10 pill input,
// matching the Games sidebar's own ~10-15% scale-up — this constant is
// only ever used by GamesCatalog's own price min/max fields, so bumping it
// doesn't affect any other page's inputs.
const numberInputClass =
  "h-11 w-full rounded-full border border-border bg-surface-elevated px-4 text-[15px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

/** One removable "Category: Strategy ×" pill (Step 49). A plain button,
 * not the static `Badge` component — chips here are interactive.
 * Exported (Step 59) so the Gift Card marketplace's filter chips reuse
 * this exact control instead of a duplicated copy. */
export function FilterChip({ label, onRemove, removeLabel }: { label: string; onRemove: () => void; removeLabel: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface-elevated py-1 pl-3 pr-1.5 text-xs font-medium text-foreground">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className="flex h-4 w-4 items-center justify-center rounded-full text-secondary hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </span>
  );
}

/**
 * The full product catalog (Step 55: rewritten into a marketplace-style
 * left filter panel + results layout, on top of Step 54's productType/
 * platform/region taxonomy). All filtering/search/sort state and logic
 * now lives in `useProductFilters` (Step 55 §2/§3) — this component is
 * purely the two responsive surfaces that read/write it: an always-visible
 * left sidebar at `lg` (1024px) and up, and the existing mobile drawer
 * pattern below that (Step 55 §11/§12 — a sidebar permanently occupying
 * tablet-width screens would fail "do not create a permanently visible
 * large sidebar" for 768/834px, so the cutover is `lg`, not `md`).
 *
 * Both surfaces render the exact same `renderFilterFields()` closure with
 * a different `idPrefix` (Step 50's pattern, unchanged) — there is still
 * exactly one implementation of each control.
 */
export function GamesCatalog({ products }: { products: Product[] }) {
  const { t } = useLanguage();
  const filters = useProductFilters(products);
  const {
    query,
    setQuery,
    // UI-03.2 §7: the Category filter/dropdown is removed from this page's
    // UI, but `useProductFilters` is only ever consumed here (confirmed —
    // no other page imports it), so its own `category`/`categories` state
    // stays completely untouched rather than risking a hook-internals
    // edit for no required benefit: `category` simply never leaves
    // `"all"` anymore with no control left to change it, which is a
    // no-op — every product still passes that (now permanently
    // unconditional) part of the filter. Same reasoning for `sort`/
    // `setSort` below (§4).
    productTypeCounts,
    regionCounts,
    productTypes,
    toggleProductType,
    platforms,
    togglePlatform,
    platformCounts,
    regions,
    toggleRegion,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    setPricePreset,
    isPricePresetActive,
    results,
    chips,
    activeFilterCount,
    hasActiveFilters,
    clearFilters,
  } = filters;

  // UI-03.1 §5–7 / UI-03.2 §1: the Games page's own "Trending Games" row —
  // starts from the real, already-existing `trending` flag `data/games.ts`
  // carries (the same signal the homepage's own "Trending Now" section
  // reads), cross-checked against this page's own resolved `products` list
  // (the same Supabase-primary/local-fallback catalog the results grid
  // below filters) so a flagged game only ever appears here if it's also a
  // real, currently-available product in this fetch. UI-03.2 §1 requires
  // exactly 10 — today's catalog has 8 `trending: true` entries, not 10, so
  // the remaining slots are filled from the rest of the real catalog,
  // highest-rated first (the same honest signal the page's own removed
  // "Popular" sort used) — never an invented game, per §1's own "use a
  // curated list from the existing catalog" fallback. If the catalog ever
  // has fewer than 10 real products total, this simply returns fewer than
  // 10 — never padded with anything fake.
  const productSlugs = useMemo(() => new Set(products.map((product) => product.slug)), [products]);
  const trendingGames = useMemo(() => {
    const flagged = getTrendingGames().filter((game) => productSlugs.has(game.slug));
    const flaggedSlugs = new Set(flagged.map((game) => game.slug));
    const rest = games
      .filter((game) => productSlugs.has(game.slug) && !flaggedSlugs.has(game.slug))
      .sort((a, b) => b.rating - a.rating);
    return [...flagged, ...rest].slice(0, 10);
  }, [productSlugs]);
  // Same "hide while actively searching" rule the Gift Card marketplace's
  // own Popular section already uses — a Trending row above filtered
  // search results would be confusing clutter, not a helpful shortcut.
  const isSearching = query.trim() !== "";

  // Trending Games navigation fix: `trendingRowRef` is attached directly to
  // the one element that actually has horizontal overflow/`scrollLeft` —
  // the `overflow-x-auto` row below, not the `<section>` around it or any
  // other wrapper. Both the Previous/Next buttons and the progress
  // indicator read/drive this exact same ref, so there's one real
  // scrollable element, not a second parallel scroll surface.
  const trendingRowRef = useRef<HTMLDivElement>(null);
  const [trendingScrollState, setTrendingScrollState] = useState({
    widthPercent: 100,
    leftPercent: 0,
    canScrollLeft: false,
    canScrollRight: false,
  });

  function handleTrendingScroll(event: React.UIEvent<HTMLDivElement>) {
    setTrendingScrollState(computeTrendingScrollState(event.currentTarget));
  }

  // Sets the correct initial state as soon as the row exists (before any
  // scroll ever fires) and keeps it correct across a breakpoint change —
  // card widths (and so how much of the row is visible, and how far it
  // can scroll) differ by breakpoint, but a resize alone fires no
  // `scroll` event on its own.
  useEffect(() => {
    const el = trendingRowRef.current;
    if (!el) return;
    setTrendingScrollState(computeTrendingScrollState(el));
    function handleResize() {
      if (el) setTrendingScrollState(computeTrendingScrollState(el));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [trendingGames.length]);

  // Previous/Next: scrolls the exact same ref'd container by one
  // "viewport's worth" of cards (`clientWidth`, not a hardcoded pixel
  // value) — responsive by construction, since `clientWidth` is already
  // whatever width this breakpoint's cards actually occupy. Smooth
  // scrolling fires native `scroll` events throughout the animation, so
  // `handleTrendingScroll` above keeps the indicator and button disabled
  // state correct the whole time — no separate "update after click" path
  // is needed.
  function scrollTrendingByPage(direction: -1 | 1) {
    const el = trendingRowRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  }

  // Mouse drag-to-scroll for the same `trendingRowRef` container — kept in
  // a plain ref (not React state) since pointermove fires far too often
  // for a re-render on every event; the only state-driving side effect of
  // a drag is setting `el.scrollLeft` directly, which fires the row's
  // existing native `scroll` event exactly like a wheel/touch scroll does
  // — `handleTrendingScroll` above already keeps the indicator/button
  // state correct for that, so dragging needs no separate wiring for it.
  // `dragging` only flips true once movement passes `DRAG_THRESHOLD_PX`
  // (5–8px, per spec) — a plain click/tap never crosses it, so cards and
  // the wishlist button keep working normally without this ever engaging.
  const trendingDragRef = useRef<{ pointerId: number; startX: number; startScrollLeft: number; dragging: boolean } | null>(
    null
  );
  // Set (not by a real click) only when an actual drag just ended, so the
  // `click` event Pointer Events synthesize right after pointerup can be
  // swallowed before it reaches a card's link or the wishlist button —
  // "do not trigger the card click after an actual drag".
  const trendingSuppressClickRef = useRef(false);
  const DRAG_THRESHOLD_PX = 6;

  function handleTrendingPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    // Touch/pen keep the browser's own native panning entirely untouched —
    // this custom drag is additive, for mouse only, per spec ("preserve
    // native touch swipe behavior").
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    trendingDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
      dragging: false,
    };
  }

  function handleTrendingPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = trendingDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const el = trendingRowRef.current;
    if (!el) return;
    const deltaX = event.clientX - drag.startX;
    if (!drag.dragging) {
      if (Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;
      drag.dragging = true;
      el.setPointerCapture(event.pointerId);
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
    }
    // Only prevented once a real drag is confirmed — never on a plain
    // click/tap, so default browser behavior (focus, native drag-image on
    // an <img>-like element, text selection) stays intact otherwise.
    event.preventDefault();
    // Drag mouse left (negative deltaX) moves content left → increases
    // scrollLeft; dragging right decreases it — the standard "grab the
    // content and pull it" mapping, mirrored from `startScrollLeft`.
    el.scrollLeft = drag.startScrollLeft - deltaX;
  }

  function endTrendingDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = trendingDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const el = trendingRowRef.current;
    if (el) {
      el.style.cursor = "";
      el.style.userSelect = "";
      if (drag.dragging && el.hasPointerCapture(event.pointerId)) {
        el.releasePointerCapture(event.pointerId);
      }
    }
    if (drag.dragging) {
      trendingSuppressClickRef.current = true;
    }
    trendingDragRef.current = null;
  }

  // Capture phase, on the row itself — runs before the click would reach
  // a card's <Link> or the wishlist <button> underneath, so a genuine
  // drag's trailing click never navigates or toggles the wishlist. A
  // normal click (no drag) never sets the flag, so it reaches its target
  // completely normally.
  function handleTrendingClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (trendingSuppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      trendingSuppressClickRef.current = false;
    }
  }

  // Step 55.1/56: checkbox options, translated for the current locale —
  // recomputed on every render (cheap, ≤11 items each) so a language
  // switch relabels them immediately, same as every other filter.
  const productTypeOptions = getProductTypes().map((info) => ({ value: info.type, label: t(info.translationKey) }));
  const platformOptions = PLATFORM_OPTIONS.map((value) => ({ value, label: t(platformTranslationKey[value]) }));
  const regionOptions = REGION_OPTIONS.map((value) => ({ value, label: t(regionTranslationKey[value]) }));

  // Step 50: the mobile filter drawer's open/closed state. Everything the
  // drawer shows/changes is the exact same state `useProductFilters`
  // returns — the drawer owns no filter state of its own.
  const [drawerOpen, setDrawerOpen] = useState(false);

  function pricePresetLabel(preset: PricePreset): string {
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
   * Every filter field, rendered identically in two places (the desktop
   * sidebar and the mobile drawer's contents) — one function, called with
   * a different `idPrefix` each time, so both copies share exactly the
   * same state/handlers (Step 50 §5) while getting distinct `id`/`htmlFor`
   * pairs (two elements sharing one `id` would be invalid HTML).
   */
  function renderFilterFields(idPrefix: string) {
    return (
      <>
        {/* Step 55.1: true multi-select (checkboxes, OR within this
            dimension) — replaces the old single-select dropdown. A
            `<fieldset>`/`<legend>` group, not a `FilterField`-wrapped
            `<label htmlFor>`, since that's the correct native semantics
            for a group of checkboxes (see MultiSelectFilter).
            Step 66 §1/§3: shows its first 6 options with Show More/Less —
            no internal scrollbar regardless of how many product types
            exist — and (§6) renders at the Games page's own larger
            `scale`. */}
        <MultiSelectFilter<ProductType>
          idPrefix={`${idPrefix}-product-type`}
          legend={t("games.filters.productTypeLabel")}
          options={productTypeOptions}
          selected={productTypes}
          onToggle={toggleProductType}
          maxVisible={FILTER_INITIAL_VISIBLE}
          showMoreLabel={t("games.filters.showMore")}
          showLessLabel={t("games.filters.showLess")}
          scale="lg"
          counts={productTypeCounts}
        />

        {/* UI-03.2 §7: the Category dropdown is removed entirely (not just
            hidden) — no empty heading, container, or divider left behind,
            since this whole `<FilterField>` block is simply gone. Its
            spot is taken by Platform's new search box below (§8), not a
            blank space. */}

        {/* Step 56: Platform, like Product Type, is now a real multi-select
            checkbox group instead of a single-select dropdown. Step 66
            §1/§4: same Show More/Less + no-scrollbar + larger `scale`
            treatment as Product Type/Region. UI-03.2 §8: now also carries
            its own search box (see `MultiSelectFilter`'s own comment for
            how `searchPlaceholder` filters this group's options without
            touching the underlying Platform data/filtering logic at all). */}
        <MultiSelectFilter<Platform>
          idPrefix={`${idPrefix}-platform`}
          legend={t("games.filters.platformLabel")}
          options={platformOptions}
          selected={platforms}
          onToggle={togglePlatform}
          maxVisible={FILTER_INITIAL_VISIBLE}
          showMoreLabel={t("games.filters.showMore")}
          showLessLabel={t("games.filters.showLess")}
          scale="lg"
          searchPlaceholder={t("games.filters.platformSearchPlaceholder")}
          noOptionsLabel={t("games.filters.noOptionsFound")}
          counts={platformCounts}
        />

        {/* Step 56 §1D / Step 66 §5: Region, also multi-select, with "show
            more" — the first 6 of the now-9-option list show by default.
            UI-03.2 §9: same opt-in search box as Platform above, and
            nothing else new — no other Region feature was added. */}
        <MultiSelectFilter<Region>
          idPrefix={`${idPrefix}-region`}
          legend={t("games.filters.regionLabel")}
          options={regionOptions}
          selected={regions}
          onToggle={toggleRegion}
          maxVisible={FILTER_INITIAL_VISIBLE}
          showMoreLabel={t("games.filters.showMore")}
          showLessLabel={t("games.filters.showLess")}
          scale="lg"
          searchPlaceholder={t("games.filters.regionSearchPlaceholder")}
          noOptionsLabel={t("games.filters.noOptionsFound")}
          counts={regionCounts}
        />

        {/* Step 66 §2: Discount and Rating filter sections removed
            entirely (labels, controls, and their underlying state/filter
            logic in useProductFilters.ts) — not just hidden here.
            Step 56 §2's own removed-filter precedent (Availability) is
            the same reasoning this step's own instruction extends. */}

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
                  {pricePresetLabel(preset)}
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
              className={numberInputClass}
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
              className={numberInputClass}
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
          {/* UI-03.1 §1: no fixed height on the title — a natural,
              content-sized heading never clips the taller line-height Lao
              or Thai glyphs can need. */}
          <h1 className="text-[28px] font-bold leading-[1.2] tracking-[-0.02em] text-foreground sm:text-[32px] lg:text-[34px]">
            {t("nav.games")}
          </h1>

          {/* UI-03.2 §3: Recently Viewed is removed from this page only —
              the reusable `RecentlyViewed` component itself is untouched
              and still renders on the Gift Card/Wallet marketplace pages
              that import it; this page simply no longer does. */}

          {/* UI-03.1 §3/§4: a large, page-level search box — still the
              exact same shared `query`/`setQuery` state the header search
              (see Navbar) and every other reader of `useSearch()` already
              use, just a second, more prominent INPUT bound to it. No new
              search/filter logic: typing here updates the same state
              typing in the header does (and vice-versa), so the two never
              drift apart — this only changes how prominently that control
              appears on this specific page. */}
          <div className="relative mt-6 w-full sm:max-w-[520px] lg:w-[520px] lg:max-w-none xl:w-[560px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("games.searchPlaceholder")}
              aria-label={t("games.searchPlaceholder")}
              className="h-[50px] w-full rounded-[14px] border border-border bg-surface-elevated pl-12 pr-4 text-[15px] text-foreground shadow-sm placeholder:text-secondary transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
          </div>

          {/* UI-03.1 §5–9 / UI-03.2 §1–2: a real, curated "Trending Games"
              row — see the `trendingGames`/`isSearching` comments above
              for how it's selected (exactly 10, real catalog only) and why
              it hides during an active search (same rule the Gift Card
              marketplace's own "Popular" section already follows, so a
              stale Trending row never sits above live search results). */}
          {!isSearching && trendingGames.length > 0 && (
            <section aria-labelledby="games-trending-heading" className="mt-10">
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="games-trending-heading"
                  className="text-[19px] font-bold leading-snug text-foreground sm:text-[21px] lg:text-[22px]"
                >
                  {t("games.trending.title")}
                </h2>
                {/* Trending Games navigation fix: the existing Previous/Next
                    buttons, now actually wired to `trendingRowRef` (see that
                    ref's own comment for why it — and only it — is the
                    correct scroll target). `disabled` mirrors
                    `trendingScrollState.canScrollLeft`/`canScrollRight`,
                    which is recomputed on every scroll (drag, trackpad,
                    touch, or these buttons themselves) and on resize, so
                    "subtle/disabled at each end" always reflects the row's
                    real position — never a value that can drift stale. */}
                <div className="flex items-center gap-2">
                  <IconButton
                    icon={<ChevronLeft className="h-5 w-5" />}
                    aria-label={t("games.trending.scrollPrevious")}
                    size="sm"
                    disabled={!trendingScrollState.canScrollLeft}
                    onClick={() => scrollTrendingByPage(-1)}
                    className="border border-border bg-surface-elevated shadow-sm disabled:pointer-events-none disabled:opacity-40"
                  />
                  <IconButton
                    icon={<ChevronRight className="h-5 w-5" />}
                    aria-label={t("games.trending.scrollNext")}
                    size="sm"
                    disabled={!trendingScrollState.canScrollRight}
                    onClick={() => scrollTrendingByPage(1)}
                    className="border border-border bg-surface-elevated shadow-sm disabled:pointer-events-none disabled:opacity-40"
                  />
                </div>
              </div>
              {/* UI-03.2 §1: ONE horizontal row at every breakpoint — no
                  grid, no wrapping, ever (a firm requirement this step
                  changed from UI-03.1's earlier responsive-grid version).
                  `flex-nowrap` + `overflow-x-auto` + each card `shrink-0`,
                  scroll-snap for a clean rest position, contained entirely
                  inside this `-mx-4 px-4`/scroll-padding pair (the same
                  full-bleed-within-Container technique the homepage's own
                  Trending row and RecentlyViewed already use) so this
                  section's own horizontal scroll never becomes the whole
                  page's horizontal scroll. Native touch/trackpad/keyboard
                  (Tab moves focus through each card's own link, which the
                  browser auto-scrolls into view) — no custom carousel
                  controls invented. §2: each card renders at `size="lg"`
                  (GameCard's own opt-in bigger typography) inside a
                  noticeably wider slot than the "All Games" grid's cards
                  below use — real responsive sizing, not a CSS transform
                  scaling the existing card. Mouse drag-to-scroll: the
                  pointer/click handlers below (see their own comments)
                  add click-and-drag panning for mouse pointers only —
                  touch/pen keep the native browser scrolling they already
                  had. `cursor-grab` (overridden to `grabbing` imperatively
                  only while an actual drag is in progress) signals the
                  affordance; it's harmless on touch devices, which have no
                  mouse cursor to show it on. */}
              <div
                ref={trendingRowRef}
                onScroll={handleTrendingScroll}
                onPointerDown={handleTrendingPointerDown}
                onPointerMove={handleTrendingPointerMove}
                onPointerUp={endTrendingDrag}
                onPointerCancel={endTrendingDrag}
                onClickCapture={handleTrendingClickCapture}
                className="-mx-4 mt-4 flex flex-nowrap gap-5 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scroll-pl-4 scroll-pr-4 cursor-grab [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {trendingGames.map((game) => (
                  <div
                    key={game.id}
                    className="w-[78vw] shrink-0 snap-start sm:w-[300px] md:w-[300px] lg:w-[300px] xl:w-[320px]"
                  >
                    <GameCard game={game} size="lg" unified />
                  </div>
                ))}
              </div>

              {/* Trending Games scroll-progress fix: a clean, minimal
                  "mini scrollbar" below the row — only shown once the row
                  actually overflows (10 large cards always will in
                  practice, but this stays honest if that ever changes).
                  The thumb's own width already communicates "there's more"
                  (it's visibly shorter than the full track), and its
                  position mirrors `trendingScrollState.leftPercent`,
                  recomputed from the row's real scroll position on every
                  `scroll` event — so it follows a mouse drag, a trackpad
                  gesture, a touch swipe, or the Previous/Next buttons
                  identically, since all of those just move the row's
                  native `scrollLeft`. `transition-[left]` is the "smooth,
                  subtle animation" — short and eased, not a jarring jump,
                  never fighting fast continuous scrolling since 150ms is
                  well under normal scroll-event cadence. Purely
                  decorative feedback (`aria-hidden`), not a second
                  control — the row itself remains the one real, keyboard-
                  and touch-accessible scroll surface. */}
              {trendingScrollState.widthPercent < 100 && (
                <div className="relative mt-3 h-1 w-full overflow-hidden rounded-full bg-surface" aria-hidden="true">
                  <div
                    className="absolute inset-y-0 rounded-full bg-primary/60 transition-[left] duration-150 ease-out"
                    style={{ width: `${trendingScrollState.widthPercent}%`, left: `${trendingScrollState.leftPercent}%` }}
                  />
                </div>
              )}
            </section>
          )}

          <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Step 55 §11: the always-visible left filter panel at lg (1024px)
                and up. Below that, §12's mobile/tablet drawer pattern takes over
                instead (390/768/834px never show a permanent sidebar).
                Step 66 §6: widened slightly (w-64/w-72 → w-72/w-80) as part
                of the sidebar's overall ~10-15% larger scale. Step 66 §10:
                `lg:sticky` keeps it in view while scrolling a long results
                grid — `lg:self-start` (already on the flex row above) stops
                it from stretching to the row's full height, and a sticky
                element can never extend past its own content or its
                parent's bounds, so it can't cover the footer.
                UI-03.3 §1: widened once more (w-72/xl:w-80 → a flat w-80)
                and the panel itself got more internal padding (p-6 → p-7),
                more space between each filter section (gap-6 → gap-8), and
                a minimal resting `shadow-sm` — the border-radius (rounded-
                2xl = 16px) and border (border-border) were already within
                spec, so neither changed. None of this touches the mobile
                drawer's own outer panel (`MobileFilterDrawer.tsx`, a
                separate wrapper this `<aside>` doesn't render at any width)
                — only the filter fields inside both surfaces change, via
                the shared `renderFilterFields()`/`MultiSelectFilter`/
                `FilterField` components (see their own comments). */}
            <aside className="hidden shrink-0 lg:sticky lg:top-24 lg:block lg:w-80">
              <div className="flex flex-col gap-8 rounded-2xl border border-border bg-surface-elevated p-7 shadow-sm">
                {renderFilterFields("filter")}
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
              {/* UI-03.1 §10 / UI-03.2 §4: a real, bigger "All Games"
                  heading — same section-title treatment as "Trending
                  Games" above. The Sort control UI-03.1 aligned here is
                  now removed entirely per §4 (no empty space left in its
                  place — the row just naturally right-aligns whatever's
                  left, the mobile-only Filters trigger). The result count
                  keeps its own `aria-live` line just below, unchanged in
                  behavior; `sort`/`setSort` stay untouched inside
                  `useProductFilters` (see the destructure comment above)
                  — `results` simply always uses its own unmodified
                  catalog order now, with no control left to change that. */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[19px] font-bold leading-snug text-foreground sm:text-[21px] lg:text-[22px]">
                  {t("games.allGamesTitle")}
                </h2>

                {/* Step 50's compact trigger, still the only way to reach the
                    filter fields below lg. */}
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
              </div>

              <MobileFilterDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onApply={() => setDrawerOpen(false)}
                onClearAll={clearFilters}
                hasActiveFilters={hasActiveFilters}
              >
                {renderFilterFields("filter-mobile")}
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
                  {/* Step 56 §3/§4: a "Clear all" control right in the chip
                      row itself — [Gift Cards ×] [Steam ×] [Clear all] —
                      alongside (not instead of) the sidebar's existing
                      "Clear filters" button, which stays for when the
                      chips row isn't the most convenient place to reach. */}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="shrink-0 whitespace-nowrap px-1 text-xs font-medium text-secondary underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {t("games.clearFilters")}
                  </button>
                </div>
              )}

              <p className="mt-4 text-[15px] text-secondary" aria-live="polite">
                {t("games.resultCount").replace("{count}", String(results.length))}
              </p>

              {results.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
                  {results.map((game) => (
                    <GameCard key={game.id} game={game} unified />
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface-elevated px-6 py-16 text-center">
                  <p className="text-base font-semibold text-foreground">{t("games.noResultsTitle")}</p>
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
