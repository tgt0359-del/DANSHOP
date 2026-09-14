import type { Platform, Product } from "@/types/product";

/**
 * The Digital Wallets marketplace's 4 named groups (Step 60 §1-4) — its
 * own browsing facet, distinct from both the Gift Card marketplace's
 * finer-grained `category` (10 values, `data/giftCardMeta.ts`) and the
 * app-wide `productType`. Deliberately NOT a stored field on `Product`:
 * every group is fully determined by a product's existing `platform` (plus
 * `productType` for the one Cross-platform edge case below), so a
 * side-table would just be redundant data that could drift out of sync —
 * `getWalletGroup` derives it on the fly instead.
 */
export type WalletGroup = "steam-wallet" | "console-wallets" | "mobile-app-wallets" | "gaming-credits";

export interface WalletGroupInfo {
  value: WalletGroup;
  labelKey: string;
}

export const walletGroups: WalletGroupInfo[] = [
  { value: "steam-wallet", labelKey: "wallets.groupSteamWallet" },
  { value: "console-wallets", labelKey: "wallets.groupConsoleWallets" },
  { value: "mobile-app-wallets", labelKey: "wallets.groupMobileAppWallets" },
  { value: "gaming-credits", labelKey: "wallets.groupGamingCredits" },
];

const CONSOLE_PLATFORMS: Platform[] = ["PlayStation", "Xbox", "Nintendo"];
const MOBILE_APP_PLATFORMS: Platform[] = ["Google Play", "Apple"];
const GAMING_CREDIT_PLATFORMS: Platform[] = ["Roblox", "Garena", "Other"];

/**
 * Which of the 4 groups a product belongs to — `undefined` for a product
 * that isn't a wallet/platform-credit product at all (e.g. the generic,
 * no-single-platform "Digital Gift Card" placeholder), which is exactly
 * the signal `app/wallets/page.tsx` uses to decide whether a product
 * belongs on the Digital Wallets marketplace in the first place.
 *
 * The one Cross-platform special case (Razer Gold, Game Currency Pack)
 * covers demo game-currency products that are genuinely not tied to one
 * storefront — still real "gaming credit" products, so "Gaming Credits"
 * (Step 60 §4's "Other gaming credits") is the honest home for them,
 * unlike a Cross-platform *gift card* (e.g. "Digital Gift Card"), which
 * isn't a wallet/credit product at all and correctly falls through to
 * `undefined`.
 *
 * Explicitly excludes `productType === "game-topup"` up front: Step 58's
 * Game Top-Up demo games (`data/topUpGames.ts`) reuse several of the same
 * `Platform` values (its own "Steam Wallet"/"PlayStation"/"Xbox"/
 * "Nintendo" top-up entries) for an entirely different flow (Region/Server
 * → Package → Player Information, via `TopUpFlowView` — no denomination-
 * only purchase). Without this check they'd match on `platform` alone and
 * leak into the Wallets marketplace as if they were the same kind of
 * listing, duplicating (and misrepresenting) what already has its own
 * dedicated home at `/top-up`.
 */
export function getWalletGroup(product: Product): WalletGroup | undefined {
  if (product.productType === "game-topup") return undefined;
  if (product.platform === "Steam") return "steam-wallet";
  if (CONSOLE_PLATFORMS.includes(product.platform)) return "console-wallets";
  if (MOBILE_APP_PLATFORMS.includes(product.platform)) return "mobile-app-wallets";
  if (GAMING_CREDIT_PLATFORMS.includes(product.platform)) return "gaming-credits";
  if (product.platform === "Cross-platform" && product.productType === "game-currency") return "gaming-credits";
  return undefined;
}
