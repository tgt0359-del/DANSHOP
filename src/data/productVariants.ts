import { convertToUsd } from "@/lib/currency/exchangeRates";
import type { ProductVariant } from "@/types/productVariant";

/**
 * Demo denomination data for the wallet/gift-card/top-up products in
 * `data/demoProducts.ts` (Step 57 — Wallet/Gift Card Product Detail
 * System). Exactly like `demoProducts.ts` itself, these are fictional
 * placeholder denominations — not real, purchasable wallet codes or
 * gift-card inventory. `price` is always derived from `value`/`currency`
 * via `convertToUsd`, the same fixed demo exchange-rate table every other
 * price conversion in the app already uses (see
 * `lib/currency/exchangeRates.ts`) — never hand-computed separately.
 *
 * Step 58 appends the Game Top-Up System's package tiers below (see
 * `topUpProductVariants`) — this array itself stays private; the single
 * exported `productVariants` further down is the two concatenated.
 */
const walletProductVariants: ProductVariant[] = [
  // --- Steam Wallet Code (Thailand) — demo-steam-wallet-thailand ---
  {
    id: "steam-wallet-thailand-50",
    productId: "demo-steam-wallet-thailand",
    label: "฿50",
    value: 50,
    currency: "THB",
    price: convertToUsd(50, "THB"),
    originalPrice: null,
    available: true,
    sortOrder: 1,
  },
  {
    id: "steam-wallet-thailand-100",
    productId: "demo-steam-wallet-thailand",
    label: "฿100",
    value: 100,
    currency: "THB",
    price: convertToUsd(100, "THB"),
    originalPrice: null,
    available: true,
    sortOrder: 2,
  },
  {
    id: "steam-wallet-thailand-200",
    productId: "demo-steam-wallet-thailand",
    label: "฿200",
    value: 200,
    currency: "THB",
    price: convertToUsd(200, "THB"),
    originalPrice: null,
    available: true,
    sortOrder: 3,
  },
  {
    id: "steam-wallet-thailand-500",
    productId: "demo-steam-wallet-thailand",
    label: "฿500",
    value: 500,
    currency: "THB",
    price: convertToUsd(475, "THB"),
    originalPrice: convertToUsd(500, "THB"),
    available: true,
    sortOrder: 4,
  },

  // --- Steam Wallet Code (Global) — demo-steam-wallet-global (Step 60) ---
  {
    id: "steam-wallet-global-5",
    productId: "demo-steam-wallet-global",
    label: "$5",
    value: 5,
    currency: "USD",
    price: 5,
    originalPrice: null,
    available: true,
    sortOrder: 1,
  },
  {
    id: "steam-wallet-global-10",
    productId: "demo-steam-wallet-global",
    label: "$10",
    value: 10,
    currency: "USD",
    price: 10,
    originalPrice: null,
    available: true,
    sortOrder: 2,
  },
  {
    id: "steam-wallet-global-20",
    productId: "demo-steam-wallet-global",
    label: "$20",
    value: 20,
    currency: "USD",
    price: 20,
    originalPrice: null,
    available: true,
    sortOrder: 3,
  },
  {
    id: "steam-wallet-global-50",
    productId: "demo-steam-wallet-global",
    label: "$50",
    value: 50,
    currency: "USD",
    price: 47.5,
    originalPrice: 50,
    available: true,
    sortOrder: 4,
  },

  // --- PlayStation Store Wallet (Thailand) — demo-playstation-wallet-thailand ---
  {
    id: "playstation-wallet-thailand-300",
    productId: "demo-playstation-wallet-thailand",
    label: "฿300",
    value: 300,
    currency: "THB",
    price: convertToUsd(300, "THB"),
    originalPrice: null,
    available: true,
    sortOrder: 1,
  },
  {
    id: "playstation-wallet-thailand-600",
    productId: "demo-playstation-wallet-thailand",
    label: "฿600",
    value: 600,
    currency: "THB",
    price: convertToUsd(600, "THB"),
    originalPrice: null,
    available: true,
    sortOrder: 2,
  },
  {
    id: "playstation-wallet-thailand-1000",
    productId: "demo-playstation-wallet-thailand",
    label: "฿1,000",
    value: 1000,
    currency: "THB",
    price: convertToUsd(1000, "THB"),
    originalPrice: null,
    available: true,
    sortOrder: 3,
  },
  {
    id: "playstation-wallet-thailand-1500",
    productId: "demo-playstation-wallet-thailand",
    label: "฿1,500",
    value: 1500,
    currency: "THB",
    price: convertToUsd(1425, "THB"),
    originalPrice: convertToUsd(1500, "THB"),
    available: true,
    sortOrder: 4,
  },

  // --- Xbox Gift Card — demo-xbox-gift-card ---
  {
    id: "xbox-gift-card-10",
    productId: "demo-xbox-gift-card",
    label: "$10",
    value: 10,
    currency: "USD",
    price: convertToUsd(10, "USD"),
    originalPrice: null,
    available: true,
    sortOrder: 1,
  },
  {
    id: "xbox-gift-card-25",
    productId: "demo-xbox-gift-card",
    label: "$25",
    value: 25,
    currency: "USD",
    price: convertToUsd(25, "USD"),
    originalPrice: null,
    available: true,
    sortOrder: 2,
  },
  {
    id: "xbox-gift-card-50",
    productId: "demo-xbox-gift-card",
    label: "$50",
    value: 50,
    currency: "USD",
    price: convertToUsd(47.5, "USD"),
    originalPrice: convertToUsd(50, "USD"),
    available: true,
    sortOrder: 3,
  },

  // --- Nintendo eShop Card — demo-nintendo-eshop-card ---
  {
    id: "nintendo-eshop-card-10",
    productId: "demo-nintendo-eshop-card",
    label: "$10",
    value: 10,
    currency: "USD",
    price: convertToUsd(10, "USD"),
    originalPrice: null,
    available: true,
    sortOrder: 1,
  },
  {
    id: "nintendo-eshop-card-20",
    productId: "demo-nintendo-eshop-card",
    label: "$20",
    value: 20,
    currency: "USD",
    price: convertToUsd(20, "USD"),
    originalPrice: null,
    available: true,
    sortOrder: 2,
  },
  {
    id: "nintendo-eshop-card-35",
    productId: "demo-nintendo-eshop-card",
    label: "$35",
    value: 35,
    currency: "USD",
    price: convertToUsd(35, "USD"),
    originalPrice: null,
    available: true,
    sortOrder: 3,
  },
  {
    id: "nintendo-eshop-card-50",
    productId: "demo-nintendo-eshop-card",
    label: "$50",
    value: 50,
    currency: "USD",
    price: convertToUsd(50, "USD"),
    originalPrice: null,
    available: true,
    sortOrder: 4,
  },

  // --- Google Play Gift Card — demo-google-play-gift-card ---
  {
    id: "google-play-gift-card-10",
    productId: "demo-google-play-gift-card",
    label: "$10",
    value: 10,
    currency: "USD",
    price: convertToUsd(10, "USD"),
    originalPrice: null,
    available: true,
    sortOrder: 1,
  },
  {
    id: "google-play-gift-card-25",
    productId: "demo-google-play-gift-card",
    label: "$25",
    value: 25,
    currency: "USD",
    price: convertToUsd(25, "USD"),
    originalPrice: null,
    available: true,
    sortOrder: 2,
  },
  {
    id: "google-play-gift-card-50",
    productId: "demo-google-play-gift-card",
    label: "$50",
    value: 50,
    currency: "USD",
    price: convertToUsd(50, "USD"),
    originalPrice: null,
    available: true,
    sortOrder: 3,
  },

  // --- Apple Gift Card — demo-apple-gift-card ---
  {
    id: "apple-gift-card-10",
    productId: "demo-apple-gift-card",
    label: "$10",
    value: 10,
    currency: "USD",
    price: convertToUsd(10, "USD"),
    originalPrice: null,
    available: true,
    sortOrder: 1,
  },
  {
    id: "apple-gift-card-25",
    productId: "demo-apple-gift-card",
    label: "$25",
    value: 25,
    currency: "USD",
    price: convertToUsd(25, "USD"),
    originalPrice: null,
    available: true,
    sortOrder: 2,
  },
  {
    id: "apple-gift-card-50",
    productId: "demo-apple-gift-card",
    label: "$50",
    value: 50,
    currency: "USD",
    price: convertToUsd(50, "USD"),
    originalPrice: null,
    available: true,
    sortOrder: 3,
  },
  {
    id: "apple-gift-card-100",
    productId: "demo-apple-gift-card",
    label: "$100",
    value: 100,
    currency: "USD",
    price: convertToUsd(95, "USD"),
    originalPrice: convertToUsd(100, "USD"),
    available: true,
    sortOrder: 4,
  },

  // --- Razer Gold — demo-razer-gold ---
  {
    id: "razer-gold-5",
    productId: "demo-razer-gold",
    label: "$5",
    value: 5,
    currency: "USD",
    price: convertToUsd(5, "USD"),
    originalPrice: null,
    available: true,
    sortOrder: 1,
  },
  {
    id: "razer-gold-10",
    productId: "demo-razer-gold",
    label: "$10",
    value: 10,
    currency: "USD",
    price: convertToUsd(10, "USD"),
    originalPrice: null,
    available: true,
    sortOrder: 2,
  },
  {
    id: "razer-gold-20",
    productId: "demo-razer-gold",
    label: "$20",
    value: 20,
    currency: "USD",
    price: convertToUsd(20, "USD"),
    originalPrice: null,
    available: true,
    sortOrder: 3,
  },
  {
    id: "razer-gold-50",
    productId: "demo-razer-gold",
    label: "$50",
    value: 50,
    currency: "USD",
    price: convertToUsd(50, "USD"),
    originalPrice: null,
    available: true,
    sortOrder: 4,
  },

  // --- Garena Shells (Thailand) — demo-garena-shells ---
  {
    id: "garena-shells-30",
    productId: "demo-garena-shells",
    label: "฿30",
    value: 30,
    currency: "THB",
    price: convertToUsd(30, "THB"),
    originalPrice: null,
    available: true,
    sortOrder: 1,
  },
  {
    id: "garena-shells-60",
    productId: "demo-garena-shells",
    label: "฿60",
    value: 60,
    currency: "THB",
    price: convertToUsd(60, "THB"),
    originalPrice: null,
    available: true,
    sortOrder: 2,
  },
  {
    id: "garena-shells-120",
    productId: "demo-garena-shells",
    label: "฿120",
    value: 120,
    currency: "THB",
    price: convertToUsd(120, "THB"),
    originalPrice: null,
    available: true,
    sortOrder: 3,
  },
  {
    id: "garena-shells-300",
    productId: "demo-garena-shells",
    label: "฿300",
    value: 300,
    currency: "THB",
    price: convertToUsd(300, "THB"),
    originalPrice: null,
    available: true,
    sortOrder: 4,
  },

  // --- Roblox Gift Card — demo-roblox-gift-card ---
  // --- Universal Gaming Gift Card — demo-gaming-gift-card-universal ---
  // Step 59 §4's exact example denomination list ($5/$10/$20/$25/$50/$100),
  // reused for both new Gift Card marketplace products via `giftCardDenominations`.
  ...giftCardDenominations("demo-roblox-gift-card"),
  ...giftCardDenominations("demo-gaming-gift-card-universal"),
];

/**
 * Step 59 — Gift Card Marketplace: builds one gift card's 6 USD
 * denominations ($5/$10/$20/$25/$50/$100, §4's exact example list) as
 * `ProductVariant`s. Unlike `topUpPackages` below, a gift card's
 * denomination genuinely IS a real-world face value (like the wallet
 * denominations above it), so `label`/`value`/`currency` follow that same
 * convention exactly — this is really just the wallet pattern applied to
 * a fixed, shared USD tier list instead of one authored per product.
 */
function giftCardDenominations(productId: string): ProductVariant[] {
  const values = [5, 10, 20, 25, 50, 100];

  return values.map((value, index) => ({
    id: `${productId}-${value}`,
    productId,
    label: `$${value}`,
    value,
    currency: "USD",
    price: value,
    originalPrice: null,
    available: true,
    sortOrder: index + 1,
  }));
}

/**
 * Step 58 — Game Top-Up System: builds one game's 4 package tiers (Small /
 * Medium / Large / Extra Large, §5) as `ProductVariant`s, reusing the
 * exact same type/architecture the wallet/gift-card denominations above
 * already established rather than inventing a parallel "package" concept.
 * `label` is deliberately the plain English tier word — unlike a
 * denomination's fixed real-world face value (e.g. "฿50"), a package tier
 * NAME is language-dependent UI text, so the on-page selector translates
 * it at render time instead (`TopUpFlowView`'s `renderLabel`, via
 * `DenominationSelector`'s generalized prop) — this stored `label` is only
 * the fallback used where translation isn't available (a resolved cart/
 * order line's synthesized title, see `lib/products/variantToGame.ts`).
 * Every price is demo pricing, already in USD — no currency/value fields
 * to derive here, unlike a denomination's real-world face value.
 */
function topUpPackages(productId: string, prices: [number, number, number, number]): ProductVariant[] {
  const tiers: { id: string; label: string }[] = [
    { id: "small", label: "Small" },
    { id: "medium", label: "Medium" },
    { id: "large", label: "Large" },
    { id: "extra-large", label: "Extra Large" },
  ];

  return tiers.map((tier, index) => ({
    id: `${productId}-${tier.id}`,
    productId,
    label: tier.label,
    value: prices[index],
    currency: "USD",
    price: prices[index],
    originalPrice: null,
    available: true,
    sortOrder: index + 1,
  }));
}

const MOBILE_TOPUP_PRICES: [number, number, number, number] = [1.99, 4.99, 9.99, 49.99];
const PC_COMPETITIVE_PRICES: [number, number, number, number] = [4.99, 9.99, 24.99, 49.99];
const PLATFORM_TOPUP_PRICES: [number, number, number, number] = [10, 25, 50, 100];

/** Package tiers for the 12 Game Top-Up demo games (`data/topUpGames.ts`). */
const topUpProductVariants: ProductVariant[] = [
  ...topUpPackages("demo-topup-mobile-legends", MOBILE_TOPUP_PRICES),
  ...topUpPackages("demo-topup-free-fire", MOBILE_TOPUP_PRICES),
  ...topUpPackages("demo-topup-pubg-mobile", MOBILE_TOPUP_PRICES),
  ...topUpPackages("demo-topup-genshin-impact", MOBILE_TOPUP_PRICES),
  ...topUpPackages("demo-topup-roblox", MOBILE_TOPUP_PRICES),
  ...topUpPackages("demo-topup-honor-of-kings", MOBILE_TOPUP_PRICES),
  ...topUpPackages("demo-topup-league-of-legends", PC_COMPETITIVE_PRICES),
  ...topUpPackages("demo-topup-valorant", PC_COMPETITIVE_PRICES),
  ...topUpPackages("demo-topup-steam-wallet", PLATFORM_TOPUP_PRICES),
  ...topUpPackages("demo-topup-playstation", PLATFORM_TOPUP_PRICES),
  ...topUpPackages("demo-topup-xbox", PLATFORM_TOPUP_PRICES),
  ...topUpPackages("demo-topup-nintendo", PLATFORM_TOPUP_PRICES),
];

/** Every demo denomination/package across the whole marketplace — wallet/
 * gift-card denominations plus Game Top-Up package tiers. */
export const productVariants: ProductVariant[] = [...walletProductVariants, ...topUpProductVariants];

/** Every variant for one product, sorted for display (ascending `sortOrder`). */
export function getVariantsForProduct(productId: string): ProductVariant[] {
  return productVariants
    .filter((variant) => variant.productId === productId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Whether a product has at least one selectable denomination — the signal
 * used to decide whether a product gets a real `/product/[slug]` detail
 * page and "Add to Cart" behavior, or stays a non-clickable demo card. */
export function hasVariants(productId: string): boolean {
  return productVariants.some((variant) => variant.productId === productId);
}
