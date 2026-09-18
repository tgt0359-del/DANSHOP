"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface HorizontalScrollState {
  /** True once the row actually overflows its own box — a row that fully
   * fits needs no controls at all (UI-04 §"do not show useless controls"). */
  canScroll: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

/**
 * UI-04 — the horizontal-scroll-row logic every "scroll a product row"
 * section on this site needs, extracted once instead of copied per
 * section (Technical §2: "If multiple sections duplicate the same
 * horizontal-scroll logic, extract a small reusable component or
 * hook"). Modeled on the same real, already-proven approach
 * `GamesCatalog.tsx`'s own ad-hoc Trending Games row already uses
 * (`scrollLeft`/`scrollWidth`/`clientWidth` read after every scroll/
 * resize, `scrollBy` with the container's own `clientWidth` as the
 * page distance) — not a new invented mechanism, just given a shared,
 * reusable home so this page's own row (and this component's own
 * `CarouselNavButtons`) don't need a second copy of it.
 *
 * No scroll library — this is ~30 lines of native `scrollBy`/
 * `scrollLeft` reads, exactly what Technical §3 ("do not add a heavy
 * carousel library") asks for.
 */
export function useHorizontalScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [state, setState] = useState<HorizontalScrollState>({
    canScroll: false,
    canScrollLeft: false,
    canScrollRight: false,
  });

  const recalculate = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setState({
      // A 1px slack on both checks below absorbs sub-pixel layout
      // rounding — without it, some browsers/zoom levels report a
      // `maxScroll` of e.g. 0.4px for a row that's visually fully
      // scrolled, which would otherwise leave the "forward" button
      // permanently (and incorrectly) enabled.
      canScroll: maxScroll > 1,
      canScrollLeft: scrollLeft > 1,
      canScrollRight: scrollLeft < maxScroll - 1,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    recalculate();

    // Covers every way the row's scroll position or overflow amount can
    // change: a manual button click, touch swipe, trackpad/wheel scroll,
    // and mouse drag all fire the element's own native `scroll` event
    // (UI-04 §"Update disabled states after: Button click / Manual touch
    // swipe / Trackpad scrolling"); `ResizeObserver` catches a window
    // resize AND a content/layout change (§"...window resize / Content/
    // layout changes") — e.g. the row gaining or losing cards, or the
    // viewport crossing a breakpoint that changes each card's own width.
    el.addEventListener("scroll", recalculate, { passive: true });
    const resizeObserver = new ResizeObserver(recalculate);
    resizeObserver.observe(el);
    window.addEventListener("resize", recalculate);

    return () => {
      el.removeEventListener("scroll", recalculate);
      resizeObserver.disconnect();
      window.removeEventListener("resize", recalculate);
    };
  }, [recalculate]);

  const scrollByDirection = useCallback((direction: "left" | "right") => {
    const el = ref.current;
    if (!el) return;

    // UI-04 §"Use a sensible scroll amount based on the visible card
    // width or approximately 2-3 cards": rather than hardcoding a card
    // width this hook has no knowledge of, scrolling by ~85% of the
    // row's own visible width naturally lands in that same "a couple of
    // cards" range for every card size this site actually uses (from a
    // ~46vw mobile card up to a fixed 16rem desktop one), without this
    // hook needing to know which.
    const distance = el.clientWidth * 0.85;

    // Respects `prefers-reduced-motion` (UI-04's own accessibility
    // §6) — an instant jump instead of an animated scroll for anyone
    // who's asked the OS for reduced motion, same as this project's
    // other motion (Framer Motion `Reveal`/`Hero` transitions) already
    // does via `useReducedMotion`-equivalent checks.
    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    el.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, []);

  return { ref, ...state, scrollByDirection };
}
