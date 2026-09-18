"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";

/**
 * UI-04 — the minimal left/right pair every horizontal product-row
 * carousel on this site can share (Technical §1/§2: reuse one component
 * rather than duplicating this per section). Circular, white, a thin
 * neutral border, a dark icon — deliberately NOT this site's solid-black
 * `buttonClasses` (too heavy for a small paired control sitting next to
 * a heading) and NOT a colored/gradient/glassy treatment §7 explicitly
 * rules out.
 *
 * Caller owns the actual scroll state/logic (`useHorizontalScroll`) and
 * just passes the result down — this component only renders the two
 * buttons and never touches the DOM/scroll position itself, so it can't
 * drift out of sync with whatever row it's paired with.
 */
export function CarouselNavButtons({
  canScrollLeft,
  canScrollRight,
  onScrollLeft,
  onScrollRight,
  className,
  ariaLabelLeft,
  ariaLabelRight,
}: {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollLeft: () => void;
  onScrollRight: () => void;
  className?: string;
  /** UI-03.2: overrides for a caller whose left/right action isn't
   * "scroll" (e.g. the Hero carousel's "previous/next slide") — both
   * default to the original product-row scroll labels, so every existing
   * caller (TrendingSection) renders identically without passing these. */
  ariaLabelLeft?: string;
  ariaLabelRight?: string;
}) {
  const { t } = useLanguage();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={onScrollLeft}
        disabled={!canScrollLeft}
        aria-label={ariaLabelLeft ?? t("actions.scrollLeft")}
        className={buttonClass}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onScrollRight}
        disabled={!canScrollRight}
        aria-label={ariaLabelRight ?? t("actions.scrollRight")}
        className={buttonClass}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/** UI-04 §"Button style": circular, white, thin neutral border, dark
 * icon, ~40px desktop (within the requested 36-44px range) growing to a
 * full 44px touch target on mobile (§"At least 44px touch target on
 * mobile when shown") since these sit in the heading row, not over the
 * cards, so there's no competing content to keep them small for. Very
 * subtle shadow only on hover (never at rest — §"very subtle shadow
 * only if needed", and resting-state flat reads calmer/more minimal).
 * `disabled:` styling (§"clear... disabled states") never hides the
 * button — a hidden-but-still-in-the-DOM control would be worse for
 * keyboard users than a visibly inert one. */
const buttonClass =
  // UI-08 §3: adds a slightly darker resting-white → `bg-surface` shift on
  // hover (previously border/shadow only) — the same hover fill the
  // wishlist button and other icon-only circular controls already use, so
  // every small round control on the site now shares one hover language.
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-white text-foreground transition-all duration-150 hover:border-foreground/30 hover:bg-surface hover:shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 sm:h-10 sm:w-10";
