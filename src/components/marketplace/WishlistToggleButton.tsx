"use client";

import { Heart } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";

/**
 * The icon-only wishlist toggle shown beside a product's title (UI-25 —
 * Product Detail Visual Polish). Standardizes the wishlist control's own
 * look across `GameDetailInfo` and `WalletProductView` — both templates
 * previously used a full `buttonClasses("ghost", ...)` button with a
 * "Wishlist" text label sitting next to the purchase actions (GameDetailInfo)
 * or next to the title (WalletProductView); this replaces both with the
 * same compact circular toggle, whose filled/outlined state makes
 * active vs. inactive unambiguous at a glance without needing a text
 * label. `aria-label`/`aria-pressed` keep it fully accessible as a true
 * toggle button even without visible text.
 *
 * Purely presentational — the caller still owns the real `wishlisted`
 * state and `toggleWishlist` call (`useWishlist()`); nothing about the
 * wishlist system itself changes here.
 */
export function WishlistToggleButton({
  wishlisted,
  onToggle,
  className,
}: {
  wishlisted: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={t("actions.wishlist")}
      aria-pressed={wishlisted}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        wishlisted ? "border-primary bg-primary text-white" : "border-border bg-surface-elevated text-foreground hover:bg-surface-hover",
        className
      )}
    >
      <Heart className={cn("h-5 w-5", wishlisted && "fill-white")} aria-hidden="true" />
    </button>
  );
}
