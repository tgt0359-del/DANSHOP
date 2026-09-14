import type { GiftCardKind } from "@/types/giftCard";

/**
 * The Gift Card marketplace's 10 browsing categories (Step 59 §1) — its
 * own facet, reusing `Product.category` (the existing "sub-classification,
 * a different axis from `productType`" field — see that field's own doc
 * comment in `types/product.ts`) exactly the way Step 58's Game Top-Up
 * categories (Mobile/PC/Console/Other Games) already do. `value` must
 * match a gift-card product's `category` string exactly (set in
 * `data/demoProducts.ts`); `labelKey` is what the category chip displays.
 */
export interface GiftCardCategory {
  value: string;
  labelKey: string;
}

export const giftCardCategories: GiftCardCategory[] = [
  { value: "Steam Wallet", labelKey: "giftCards.categorySteamWallet" },
  { value: "PlayStation Store", labelKey: "giftCards.categoryPlayStation" },
  { value: "Xbox", labelKey: "giftCards.categoryXbox" },
  { value: "Nintendo", labelKey: "giftCards.categoryNintendo" },
  { value: "Google Play", labelKey: "giftCards.categoryGooglePlay" },
  { value: "Apple Gift Card", labelKey: "giftCards.categoryApple" },
  { value: "Roblox", labelKey: "giftCards.categoryRoblox" },
  { value: "Garena", labelKey: "giftCards.categoryGarena" },
  { value: "Gaming Gift Cards", labelKey: "giftCards.categoryGamingGiftCards" },
  { value: "Other Gift Cards", labelKey: "giftCards.categoryOtherGiftCards" },
];

/**
 * Which `GiftCardKind` each Gift Card marketplace product is (Step 59
 * §3's "Product Type" filter) — see `types/giftCard.ts`'s own doc comment
 * for why this lives here rather than on `Product` or reusing the
 * app-wide `ProductType`.
 */
export const giftCardKindByProductId: Record<string, GiftCardKind> = {
  "demo-gift-card-digital": "gift-card",
  "demo-steam-wallet-thailand": "wallet",
  "demo-steam-wallet-global": "wallet",
  "demo-playstation-wallet-thailand": "wallet",
  "demo-xbox-gift-card": "gaming-gift-card",
  "demo-nintendo-eshop-card": "gaming-gift-card",
  "demo-google-play-gift-card": "gift-card",
  "demo-apple-gift-card": "gift-card",
  "demo-razer-gold": "wallet",
  "demo-garena-shells": "wallet",
  "demo-roblox-gift-card": "gaming-gift-card",
  "demo-gaming-gift-card-universal": "gaming-gift-card",
  // Step 60: also part of the Wallets marketplace's "Gaming Credits" group
  // (see `lib/products/walletGroups.ts`) — a generic in-game currency
  // pack is "wallet"-like credit, the same reasoning Razer Gold got.
  "demo-game-currency-pack": "wallet",
};

export function getGiftCardKind(productId: string): GiftCardKind | undefined {
  return giftCardKindByProductId[productId];
}
