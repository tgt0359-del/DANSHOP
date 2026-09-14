import type { Region } from "@/types/product";

/**
 * Which translation key each `Region` value maps to (Step 54; wired into
 * the Games page's region filter and its chips as of Step 55). Mirrors
 * `platformLabels.ts`/`lib/orders/orderStatusLabels.ts`'s pattern. Every
 * real product is `"Global"` (Step 54) — "Thailand"/"Laos" are offered as
 * filter options because the taxonomy supports them, honestly returning
 * zero results today rather than being hidden or faked.
 */
export const regionTranslationKey: Record<Region, string> = {
  Global: "regions.global",
  Thailand: "regions.thailand",
  Laos: "regions.laos",
  "United States": "regions.unitedStates",
  Europe: "regions.europe",
  Asia: "regions.asia",
  Japan: "regions.japan",
  "South Korea": "regions.southKorea",
  Turkey: "regions.turkey",
  Other: "regions.other",
};
