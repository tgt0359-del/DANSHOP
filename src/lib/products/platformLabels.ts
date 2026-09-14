import type { Platform } from "@/types/product";

/**
 * Which translation key each `Platform` value maps to (Step 54; wired into
 * the Games page's platform filter and its chips as of Step 55 — see
 * `hooks/useProductFilters.ts`/`components/games/ProductFilterPanel.tsx`).
 * Mirrors `lib/orders/orderStatusLabels.ts`'s pattern. No real product
 * uses `"Cross-platform"` yet (Step 54) — it's offered as a filter option
 * because the taxonomy supports it, the same way the pre-existing
 * "Console" option was already offered with zero matching products before
 * this step.
 */
export const platformTranslationKey: Record<Platform, string> = {
  PC: "platforms.pc",
  Mobile: "platforms.mobile",
  Console: "platforms.console",
  "PC & Mobile": "platforms.pcAndMobile",
  "Cross-platform": "platforms.crossPlatform",
  Steam: "platforms.steam",
  PlayStation: "platforms.playstation",
  Xbox: "platforms.xbox",
  Nintendo: "platforms.nintendo",
  "Google Play": "platforms.googlePlay",
  Apple: "platforms.apple",
  Roblox: "platforms.roblox",
  Garena: "platforms.garena",
  Other: "platforms.other",
};
