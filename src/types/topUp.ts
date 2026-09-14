/**
 * Game Top-Up System (Step 58). A demo game's player-information
 * requirements are data, not per-game code — `getTopUpFieldConfig`
 * (data/topUpFieldConfig.ts) looks one of these up by `productId` and the
 * Top-Up flow page renders exactly the fields it lists. This is
 * deliberately generic/illustrative (a MOBA needs a Player ID + Server ID,
 * a game with a public username needs only a Player Name, ...) — it does
 * not claim to reproduce any specific platform's actual real account-field
 * requirements, which this project has no authority to state as fact.
 */
export interface TopUpRegionOption {
  id: string;
  /** Reuses the existing `regions.*` translation namespace (Step 54/56) —
   * no new region-label keys needed. */
  labelKey: string;
}

export interface TopUpFieldConfig {
  productId: string;
  requiresPlayerId: boolean;
  requiresServerId: boolean;
  requiresPlayerName: boolean;
  requiresRegion: boolean;
  regions?: TopUpRegionOption[];
}

/** What the shopper actually typed into the Player Information step,
 * keyed by field name — carried on the cart line (`CartItem.topUpInfo`)
 * and, if the order is placed, on the order record (`OrderItem.topUpInfo`)
 * purely for on-screen display. Never a real account credential: only
 * public-facing identifiers a player would normally give a top-up seller
 * (Player ID, Server ID, Region, Player Name) — see the strict "never
 * request password/PIN/OTP/bank/card details" rule this step is under. */
export type TopUpInfo = Partial<Record<"playerId" | "serverId" | "region" | "playerName", string>>;
