"use client";

import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";
import type { Game } from "@/types/game";

/**
 * Product detail page image/gallery area (Step 51, image handling
 * reworked in UI-13). Uses the real `product.images` data (Step 39/40's
 * Supabase-backed catalog, joined through `product_images`) — not
 * invented, not a second image system.
 *
 * UI-13: every demo product's `image`/`images` field today is a
 * placehold.co URL (`data/games.ts`, `productAdapter.ts` — a solid
 * near-black `#111111` box with the title as white text, generated
 * because this project has no real backend/artwork yet, not a genuine
 * product photo). Rendering that literally, full-size, read as a broken
 * "large black box" rather than a deliberate placeholder — `PLACEHOLDER_IMAGE_HOST`
 * below filters those out of `realImages` the exact same way an empty
 * string already was, so both "no image URL at all" and "only a
 * generated stand-in image" land on the one shared, deliberately-designed
 * fallback (`ImagePreviewUnavailable`) instead of two different-looking
 * broken states. A future real image (Supabase `product_images`, an
 * actual artwork URL) is unaffected — it's simply not a placehold.co URL,
 * so it flows through the normal `realImages` path unchanged.
 */
const PLACEHOLDER_IMAGE_HOST = "placehold.co";

/**
 * The shared "nothing to show" state — a quiet, light panel (never a
 * dark/black block) with a soft gradient, a couple of very faint dashed
 * rings (the same "no real asset yet" visual language
 * `PaymentMethods`/`Footer`'s own dashed-circle placeholders already use
 * elsewhere on the site, not a new decorative idea), and a small,
 * centered, honest label — never implies there's real artwork here.
 */
function ImagePreviewUnavailable() {
  const { t } = useLanguage();

  return (
    <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-white to-surface">
      <div aria-hidden="true" className="absolute h-44 w-44 rounded-full border border-dashed border-border" />
      <div aria-hidden="true" className="absolute h-24 w-24 rounded-full border border-dashed border-border" />
      <span className="relative text-sm font-medium text-secondary">{t("gameDetail.previewUnavailable")}</span>
    </div>
  );
}

export function ProductGallery({ game, images }: { game: Game; images: string[] }) {
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const realImages = images.filter((url) => url.trim() !== "" && !url.includes(PLACEHOLDER_IMAGE_HOST));

  // Step 69 §2/§11: the same subtle hover-lift (shadow, and — for a real
  // image — a slight image scale) `GameCard` already uses everywhere else
  // in the app, reused here for a "premium" feel without inventing a new
  // visual treatment. Framer Motion's own `MotionConfig reducedMotion="user"`
  // (root layout) and the `prefers-reduced-motion` rule in globals.css
  // both cover this plain CSS transition already.
  if (realImages.length === 0) {
    return (
      <div className="group overflow-hidden rounded-2xl border border-border transition-shadow duration-200 hover:shadow-md">
        <ImagePreviewUnavailable />
      </div>
    );
  }

  const activeImage = realImages[Math.min(selectedIndex, realImages.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="group overflow-hidden rounded-2xl border border-border transition-shadow duration-200 hover:shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element -- a real,
            external image URL from the catalog data, not a local asset
            Next's image optimizer would help with (Step 44 used the same
            approach for the category page's product cards). */}
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
                "h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                index === selectedIndex ? "border-black" : "border-transparent hover:border-border"
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
