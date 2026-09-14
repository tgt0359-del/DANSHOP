"use client";

import { useLanguage } from "@/hooks/useLanguage";

/**
 * Visually hidden until keyboard-focused. Without this, a keyboard or
 * screen-reader user has to tab through the entire header (logo, every nav
 * link, search, language switcher, wishlist, account, cart, menu) before
 * reaching any page content — on every single page. This lets them jump
 * straight to #main-content instead. No visual effect for mouse users.
 */
export function SkipToContent() {
  const { t } = useLanguage();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
    >
      {t("common.skipToContent")}
    </a>
  );
}
