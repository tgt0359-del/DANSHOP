import type { TopUpFieldConfig, TopUpRegionOption } from "@/types/topUp";

/** Reused across several games below rather than repeated inline — same
 * "Global"/"Asia"/... options `types/product.ts`'s `Region` already
 * defines, via the existing `regions.*` translation keys. */
const ASIA_GLOBAL: TopUpRegionOption[] = [
  { id: "asia", labelKey: "regions.asia" },
  { id: "global", labelKey: "regions.global" },
];

const SERVER_REGIONS: TopUpRegionOption[] = [
  { id: "asia", labelKey: "regions.asia" },
  { id: "europe", labelKey: "regions.europe" },
  { id: "unitedStates", labelKey: "regions.unitedStates" },
];

const GLOBAL_ONLY: TopUpRegionOption[] = [{ id: "global", labelKey: "regions.global" }];

/**
 * One entry per Game Top-Up demo product (Step 58 §4) — which of Player
 * ID / Server ID / Player Name / Region the flow page asks for. Every
 * field here is a public-facing identifier a top-up seller would
 * ordinarily ask a customer for; this project never requests a password,
 * PIN, OTP, or any payment credential anywhere in this flow.
 */
export const topUpFieldConfigs: TopUpFieldConfig[] = [
  {
    productId: "demo-topup-mobile-legends",
    requiresPlayerId: true,
    requiresServerId: true,
    requiresPlayerName: false,
    requiresRegion: true,
    regions: ASIA_GLOBAL,
  },
  {
    productId: "demo-topup-free-fire",
    requiresPlayerId: true,
    requiresServerId: false,
    requiresPlayerName: false,
    requiresRegion: true,
    regions: ASIA_GLOBAL,
  },
  {
    productId: "demo-topup-pubg-mobile",
    requiresPlayerId: true,
    requiresServerId: false,
    requiresPlayerName: false,
    requiresRegion: true,
    regions: ASIA_GLOBAL,
  },
  {
    productId: "demo-topup-genshin-impact",
    requiresPlayerId: true,
    requiresServerId: false,
    requiresPlayerName: false,
    requiresRegion: true,
    regions: SERVER_REGIONS,
  },
  {
    productId: "demo-topup-roblox",
    requiresPlayerId: false,
    requiresServerId: false,
    requiresPlayerName: true,
    requiresRegion: false,
  },
  {
    productId: "demo-topup-honor-of-kings",
    requiresPlayerId: true,
    requiresServerId: true,
    requiresPlayerName: false,
    requiresRegion: true,
    regions: ASIA_GLOBAL,
  },
  {
    productId: "demo-topup-league-of-legends",
    requiresPlayerId: false,
    requiresServerId: false,
    requiresPlayerName: true,
    requiresRegion: true,
    regions: SERVER_REGIONS,
  },
  {
    productId: "demo-topup-valorant",
    requiresPlayerId: false,
    requiresServerId: false,
    requiresPlayerName: true,
    requiresRegion: true,
    regions: SERVER_REGIONS,
  },
  {
    productId: "demo-topup-steam-wallet",
    requiresPlayerId: true,
    requiresServerId: false,
    requiresPlayerName: false,
    requiresRegion: true,
    regions: GLOBAL_ONLY,
  },
  {
    productId: "demo-topup-playstation",
    requiresPlayerId: true,
    requiresServerId: false,
    requiresPlayerName: false,
    requiresRegion: true,
    regions: SERVER_REGIONS,
  },
  {
    productId: "demo-topup-xbox",
    requiresPlayerId: true,
    requiresServerId: false,
    requiresPlayerName: false,
    requiresRegion: true,
    regions: SERVER_REGIONS,
  },
  {
    productId: "demo-topup-nintendo",
    requiresPlayerId: true,
    requiresServerId: false,
    requiresPlayerName: false,
    requiresRegion: true,
    regions: SERVER_REGIONS,
  },
];

export function getTopUpFieldConfig(productId: string): TopUpFieldConfig | undefined {
  return topUpFieldConfigs.find((config) => config.productId === productId);
}
