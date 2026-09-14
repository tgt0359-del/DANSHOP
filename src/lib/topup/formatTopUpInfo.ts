import type { TopUpInfo } from "@/types/topUp";

/**
 * Renders a shopper's Player Information (Step 58) as one compact
 * "Label: value · Label: value" string, in field order Player ID → Server
 * ID → Player Name → Region — reused by every surface that shows a
 * Top-Up cart/order line (`CartDrawer`, `OrderSummary`) so they can never
 * format it differently. Returns null when there's nothing to show (every
 * non-Top-Up line, whose `topUpInfo` is undefined).
 *
 * `topUpInfo.region` stores the region's `id` (e.g. "asia"), not display
 * text — those ids were deliberately chosen to match the existing
 * `regions.*` translation keys 1:1 (see `data/topUpFieldConfig.ts`), so
 * `t(\`regions.${region}\`)` is the real, already-localized label, not a
 * second translation table.
 */
export function formatTopUpInfo(topUpInfo: TopUpInfo | undefined, t: (key: string) => string): string | null {
  if (!topUpInfo) return null;

  const parts: string[] = [];
  if (topUpInfo.playerId) parts.push(`${t("topup.playerId")}: ${topUpInfo.playerId}`);
  if (topUpInfo.serverId) parts.push(`${t("topup.serverId")}: ${topUpInfo.serverId}`);
  if (topUpInfo.playerName) parts.push(`${t("topup.playerName")}: ${topUpInfo.playerName}`);
  if (topUpInfo.region) parts.push(`${t("topup.region")}: ${t(`regions.${topUpInfo.region}`)}`);

  return parts.length > 0 ? parts.join(" · ") : null;
}
