"use client";

import Link from "next/link";
import { useCurrency } from "@/hooks/useCurrency";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/currency/formatPrice";

/**
 * One header search suggestion — either a real game (`href` is its
 * product detail page) or a demo catalog product (Step 57 §10 — `href` is
 * its individual detail page if it has one, Step 57/58/60, or its category
 * listing page otherwise, since a non-interactive demo product has no
 * detail page of its own — see `data/demoProducts.ts`). `key` is unique
 * across every source `Navbar.tsx` searches.
 *
 * `typeLabel`/`platformLabel` (Step 62 §2) are already-translated display
 * strings — resolved once in `Navbar.tsx` (which has `t()`), not here, so
 * this component stays a plain, presentational renderer of whatever it's
 * given, matching its own existing "purely presentational" design.
 * `platformLabel` is omitted only if a product's platform doesn't map to a
 * translatable value (never happens in practice — kept optional for
 * defensiveness, not because any real product lacks one).
 */
export interface SearchSuggestionItem {
  key: string;
  title: string;
  href: string;
  price: number;
  /** Step 60's "starting from" convention — true when `price` is the
   * lowest of several denominations/packages rather than a single fixed
   * price (see `data/productVariants.ts`'s `hasVariants`). */
  priceIsFrom: boolean;
  typeLabel: string;
  platformLabel?: string;
}

/**
 * The header search's autocomplete dropdown (Step 52 §8, extended Step
 * 62 §2) — a compact list of matching products, each showing its name,
 * type/platform, and price (still no images/fake "popular searches" —
 * "keep suggestions limited and lightweight"). Purely presentational:
 * `Navbar.tsx` owns the query, matching, and keyboard-navigation state;
 * this only renders whatever list and active index it's given.
 *
 * Accessible listbox pattern (Step 52 §15): the input this is paired with
 * carries `role="combobox"`/`aria-expanded`/`aria-controls`/
 * `aria-activedescendant` (set in Navbar.tsx); each option here gets a
 * matching `id` and `aria-selected`.
 */
export function SearchSuggestions({
  id,
  ariaLabel,
  suggestions,
  activeIndex,
  onSelect,
}: {
  id: string;
  ariaLabel: string;
  suggestions: SearchSuggestionItem[];
  activeIndex: number;
  onSelect: () => void;
}) {
  const { t } = useLanguage();
  const { currency } = useCurrency();

  return (
    <ul
      id={id}
      role="listbox"
      aria-label={ariaLabel}
      className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-border bg-white p-2 shadow-lg"
    >
      {suggestions.map((item, index) => (
        <li key={item.key} id={`${id}-option-${index}`} role="option" aria-selected={index === activeIndex}>
          <Link
            href={item.href}
            prefetch={false}
            onClick={onSelect}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
              index === activeIndex ? "bg-surface" : "hover:bg-surface"
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{item.title}</p>
              <p className="truncate text-xs text-secondary">
                {item.typeLabel}
                {item.platformLabel ? ` · ${item.platformLabel}` : ""}
              </p>
            </div>
            <span className="shrink-0 text-xs text-secondary">
              {item.price === 0 ? (
                t("common.free")
              ) : (
                <>
                  {item.priceIsFrom && <span className="mr-1">{t("wallet.from")}</span>}
                  {formatPrice(item.price, currency)}
                </>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
