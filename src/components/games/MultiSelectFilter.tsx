"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * A compact multi-select checkbox group for one filter dimension (Step
 * 55.1) — real `<input type="checkbox">` semantics (native keyboard
 * support, Space to toggle, screen-reader-understood checked state) inside
 * a `<fieldset>`/`<legend>` so the whole group reads as one labeled unit,
 * not a list of unrelated checkboxes.
 *
 * Generic over the option's value type so this isn't Product-Type-specific
 * — Platform and Region (Step 56) render through this exact same
 * component with their own `T` and options, instead of a second, parallel
 * checkbox-list implementation.
 *
 * `maxVisible` (Step 56 §1D — "only show useful options initially, add a
 * small 'Show more' control if needed"): when given, only the first
 * `maxVisible` options render until the user expands the list. A selected
 * option in the hidden tail keeps the list auto-expanded — a checked box
 * should never be able to scroll out of reach and become impossible to
 * uncheck. `showMoreLabel`/`showLessLabel` are passed in (already
 * translated) rather than this component calling `useLanguage()` itself,
 * keeping it a plain, prop-driven component like the rest of its API.
 *
 * Step 66 §1: the options list itself never scrolls internally (no
 * `max-h`/`overflow-y-auto`) — `maxVisible` is the ONLY thing that keeps a
 * long option list from growing the sidebar unboundedly; Show More/Less
 * expands or collapses the real list instead of revealing a scrollable
 * viewport onto it.
 *
 * `scale` (Step 66 §6 — "increase the sidebar's visual scale ~10-15%,
 * without affecting other pages"): this component is also used by the
 * Gift Card and Wallet marketplace filter panels (`GiftCardMarketplaceView`/
 * `WalletMarketplaceView`), so the size increase can't just be hardcoded
 * here — that would resize those pages' filters too, outside this step's
 * scope. Defaults to `"default"` (the original, unchanged sizing) for
 * every existing call site; only `GamesCatalog` opts into `"lg"`.
 *
 * `searchPlaceholder` (UI-03.2 §8/§9): another opt-in-only seam, same
 * pattern as `scale` — when given, a small search box renders between the
 * legend and the option list, filtering `options` by label (case-
 * insensitive substring) before the existing `maxVisible`/"Show more"
 * logic ever sees them, so a search match hidden behind "Show more" still
 * surfaces immediately. Every call site that omits it (Product Type here,
 * and every group on the Gift Card/Wallet marketplaces) renders exactly
 * as before — only `GamesCatalog`'s own Platform and Region groups pass
 * it. Clearing the box restores every option, since an empty query never
 * filters anything out below.
 *
 * UI-03.3: the `lg` branch's own typography/spacing/search-input styling
 * was tuned for readability (bigger legend, 14–15px labels, taller
 * ~40px-tall clickable rows, a subtle persistent tint on a checked row,
 * search input restyled to a soft `rounded-xl` instead of a full pill) —
 * every change lives inside `lg ? ... : ...`, so the `default` branch
 * (still every Gift Card/Wallet group) is untouched pixel-for-pixel.
 *
 * `counts` (UI-03.5 §4/§5/§7/§8): another opt-in-only seam — when given, a
 * small muted number renders at the right edge of each option row (real
 * per-option product counts, computed by the caller from its own already-
 * fetched catalog — see `useProductFilters`'s/`useGiftCardFilters`'s own
 * `productTypeCounts`/`regionCounts` comments). Omit to render exactly as
 * before; only `GamesCatalog`'s Product Type/Region groups and
 * `GiftCardMarketplaceView`'s Region group pass it — Platform (both pages)
 * and every other existing call site render unchanged, per this step's own
 * "do not add unrelated Platform features" instruction.
 */
export function MultiSelectFilter<T extends string>({
  idPrefix,
  legend,
  options,
  selected,
  onToggle,
  maxVisible,
  showMoreLabel,
  showLessLabel,
  scale = "default",
  searchPlaceholder,
  noOptionsLabel,
  counts,
}: {
  idPrefix: string;
  legend: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
  maxVisible?: number;
  showMoreLabel?: string;
  showLessLabel?: string;
  scale?: "default" | "lg";
  /** Presence alone enables the search box (also used as its placeholder
   * and accessible name) — omit to keep this group exactly as before. */
  searchPlaceholder?: string;
  /** Shown instead of the (now-empty) option list when a search matches
   * nothing. Only meaningful alongside `searchPlaceholder`. */
  noOptionsLabel?: string;
  /** Real per-option product count, shown muted at the row's right edge.
   * A missing key (an option with zero real products) renders as 0, never
   * hidden — an honest "0" is still a real count. */
  counts?: Partial<Record<T, number>>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchEnabled = searchPlaceholder !== undefined;
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const matchingOptions =
    searchEnabled && trimmedQuery !== ""
      ? options.filter((option) => option.label.toLowerCase().includes(trimmedQuery))
      : options;

  const hasOverflow = maxVisible !== undefined && matchingOptions.length > maxVisible;
  const hiddenHasSelection =
    hasOverflow && matchingOptions.slice(maxVisible).some((option) => selected.includes(option.value));
  const effectivelyExpanded = expanded || hiddenHasSelection;
  const visibleOptions = hasOverflow && !effectivelyExpanded ? matchingOptions.slice(0, maxVisible) : matchingOptions;

  const lg = scale === "lg";

  return (
    <fieldset className={cn("flex flex-col", lg ? "gap-2.5" : "gap-1.5")}>
      <legend className={cn(lg ? "text-base font-bold text-foreground" : "text-xs font-medium text-secondary")}>
        {legend}
      </legend>
      {searchEnabled && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-11 w-full rounded-xl border border-border bg-surface-elevated pl-9 pr-4 text-sm text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
        </div>
      )}
      {searchEnabled && visibleOptions.length === 0 ? (
        <p className={cn("px-1 text-secondary", lg ? "text-sm" : "text-xs")}>{noOptionsLabel}</p>
      ) : (
        <div className={cn("flex flex-col", lg ? "gap-1.5" : "gap-0.5")}>
          {visibleOptions.map((option) => {
            const id = `${idPrefix}-${option.value}`;
            const checked = selected.includes(option.value);
            return (
              <label
                key={option.value}
                htmlFor={id}
                className={cn(
                  "flex cursor-pointer items-center rounded-lg text-foreground transition-colors hover:bg-surface-hover",
                  lg ? "gap-2.5 px-2.5 py-2.5 text-[15px] leading-normal" : "gap-2 px-2 py-1.5 text-sm",
                  // UI-03.3 §8: "selected state clearly visible" — a subtle,
                  // persistent tint (same neutral `bg-surface` hover
                  // already uses, so a checked row never needs a new
                  // color) plus a small weight bump on the label text.
                  lg && checked && "bg-surface font-medium"
                )}
              >
                <input
                  id={id}
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(option.value)}
                  className={cn(
                    "shrink-0 rounded border-border accent-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    lg ? "h-5 w-5" : "h-4 w-4"
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {/* UI-03.5 §9 / UI-03.6 §7: `ml-auto` (not a second flex
                    group) keeps this a one-row flex layout, pushed to the
                    far right — equivalent to `justify-content: space-
                    between` here since it's the row's last child; the
                    label span above already shares the row via `flex-1
                    min-w-0 truncate`, so a long Lao/Thai/English label
                    shrinks and ellipsizes instead of overlapping or
                    pushing the count out. UI-03.6 §7: the count's own
                    size/weight is now fixed at `text-xs`/`font-normal`
                    (12px/400) regardless of `lg` — "one consistent style"
                    across every group (Games and Gift Cards alike) rather
                    than scaling with the row's own `lg` typography. */}
                {counts && (
                  <span className="shrink-0 text-xs font-normal tabular-nums text-secondary">
                    {counts[option.value] ?? 0}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}
      {hasOverflow && !hiddenHasSelection && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={effectivelyExpanded}
          className={cn(
            "self-start font-medium text-secondary underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            lg ? "px-1 text-sm" : "px-1 text-xs"
          )}
        >
          {expanded ? showLessLabel : showMoreLabel}
        </button>
      )}
    </fieldset>
  );
}
