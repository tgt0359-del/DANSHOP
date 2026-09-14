"use client";

import { useState } from "react";
import { GameArtwork } from "@/components/ui/GameArtwork";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";
import type { Game } from "@/types/game";

/**
 * Product detail page image/gallery area (Step 51). Uses the real
 * `product.images` data (Step 39/40's Supabase-backed catalog, joined
 * through `product_images`) — not invented, not a second image system.
 *
 * Graceful fallback (Step 51 §3): if no real image URL exists for this
 * product, this renders the existing `GameArtwork` procedural visual —
 * the same one every other surface in the app already uses — rather than
 * a broken `<img>` or a blank box. This is also what makes "missing image
 * URLs" safe: nothing here assumes `images` is non-empty.
 *
 * Today, every one of the 16 real products has exactly one image (Step
 * 45's audit), so this renders as a single, clean image with no
 * thumbnails — no fake gallery images were invented to make it look like
 * a multi-image carousel (Step 51 §3). The thumbnail row is real,
 * accessible (`role="tablist"`/`aria-selected`), and simply doesn't
 * render at all when there's nothing to switch between; it's ready for a
 * product that genuinely has more than one image without needing to be
 * rebuilt then.
 */
export function ProductGallery({ game, images }: { game: Game; images: string[] }) {
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const realImages = images.filter((url) => url.trim() !== "");

  if (realImages.length === 0) {
    return (
      <div className="group overflow-hidden rounded-2xl border border-border transition-shadow duration-200 hover:shadow-md">
        <GameArtwork game={game} className="aspect-[16/10] w-full transition-transform duration-300 ease-out group-hover:scale-105" />
      </div>
    );
  }

  const activeImage = realImages[Math.min(selectedIndex, realImages.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      {/* Step 69 §2/§11: the same subtle hover-lift (shadow + slight image
          scale) `GameCard` already uses everywhere else in the app —
          reused here for a "premium" feel without inventing a new visual
          treatment. Framer Motion's own `MotionConfig reducedMotion="user"`
          (root layout) and the `prefers-reduced-motion` rule in
          globals.css both cover this plain CSS transition already. */}
      <div className="group overflow-hidden rounded-2xl border border-border transition-shadow duration-200 hover:shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element -- a real,
            external placehold.co URL from the catalog data, not a local
            asset Next's image optimizer would help with (Step 44 used the
            same approach for the category page's product cards). */}
        <img
          src={activeImage}
          alt={game.title}
          className="aspect-[16/10] w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </div>

      {realImages.length > 1 && (
        <div className="flex gap-2" role="tablist" aria-label={t("gameDetail.gallery")}>
          {realImages.map((url, index) => (
            <button
              key={url}
              type="button"
              role="tab"
              aria-selected={index === selectedIndex}
              aria-label={t("gameDetail.viewImage").replace("{index}", String(index + 1))}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                index === selectedIndex ? "border-primary" : "border-transparent hover:border-border"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
