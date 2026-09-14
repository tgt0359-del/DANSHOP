import { convertToUsd } from "@/lib/currency/exchangeRates";
import type { Product } from "@/types/product";

/**
 * Step 57's demo catalog — UI/demo records only, so the expanded
 * marketplace taxonomy (`ProductType`, `data/marketplaceCategories.ts`)
 * is actually visible and browsable, not just an empty set of filter
 * checkboxes. These are fictional placeholders, exactly like
 * `data/games.ts`'s own header comment already establishes for the real
 * game catalog ("none of this is real product data") — never claimed to
 * be real, purchasable inventory.
 *
 * Deliberately kept OUT of `data/games.ts` (a genuinely different array,
 * not a duplicate of it — these aren't games and don't fit the `Game`
 * shape) and out of `getProducts()`/the Games page's catalog entirely —
 * see `lib/products/productRepository.ts`'s `getMarketplaceProducts()`.
 *
 * As of the Wallet/Gift Card Product Detail step, several of these
 * (Steam Wallet, PlayStation Wallet, Xbox/Nintendo/Google Play/Apple gift
 * cards, Razer Gold, Garena Shells) are DENOMINATED products — each has
 * one or more selectable variants in `data/productVariants.ts` (a ฿50
 * Steam Wallet code and a ฿500 one are different variants of this SAME
 * product record, not separate products). A product's own `price` here
 * is its lowest variant's price — a sensible "starting from" value for
 * contexts that only see the base `Product` (search results, category
 * cards) before a specific denomination is chosen. Products with
 * variants get a real, interactive detail page (`/product/[slug]`) and
 * can be added to cart like any real product; products without variants
 * (DLC Expansion, Software License, ...) keep the original "Demo" badge,
 * non-clickable, preview-only treatment.
 *
 * Step 58 removed the old generic "Mobile Top Up" placeholder that used to
 * live here — the Game Top-Up System (`data/topUpGames.ts`) replaces it
 * with 12 real, named demo games, each with its own package tiers and
 * player-information flow, so a single generic stand-in product is no
 * longer needed.
 *
 * Step 59 (Gift Card Marketplace) added 2 new entries (Roblox Gift Card,
 * Universal Gaming Gift Card) and gave every gift-card/wallet/game-currency
 * product here a `category` matching one of the Gift Card marketplace's 10
 * browsing categories (`data/giftCardMeta.ts`) — a facet independent of
 * `productType`, the same "category vs. productType are different axes"
 * pattern Step 58's Game Top-Up categories already established. A few
 * platforms were also corrected from the generic "Cross-platform" to their
 * real storefront ("Google Play"/"Apple"/"Garena"/"Roblox" — new `Platform`
 * values, Step 59), the same reasoning Step 56 applied to Steam.
 *
 * Step 60 (Steam Wallet & Platform Wallet Expansion) added "Steam Wallet
 * Code (Global)" — Steam Wallet now has both a Thailand and a Global
 * region variant, each its own product (denominations are region-specific
 * real-world SKUs, not a field that varies within one product — same
 * reasoning every other region-specific product here already follows).
 */
const DEMO_CREATED_AT = "2026-09-07T00:00:00.000Z";

export const demoProducts: Product[] = [
  {
    id: "demo-gift-card-digital",
    slug: "digital-gift-card",
    name: "Digital Gift Card",
    description: "A demo digital gift card listing — illustrates how gift card products will appear once real inventory exists.",
    shortDescription: "Demo gift card listing.",
    // Step 59: "Other Gift Cards" — the Gift Card marketplace's own
    // browsing-category facet (see `data/giftCardMeta.ts`), a different
    // axis from `productType` below. Safe to repurpose this field: no
    // component currently displays or filters this specific product by
    // its old "Gift Card" category text (verified before changing it).
    category: "Other Gift Cards",
    productType: "gift-card",
    platform: "Cross-platform",
    region: "Global",
    price: 25,
    originalPrice: null,
    currency: "USD",
    rating: 4.5,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Digital+Gift+Card",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=Digital+Gift+Card"],
    badge: null,
    isFeatured: false,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
  {
    id: "demo-steam-wallet-thailand",
    slug: "steam-wallet-thailand",
    name: "Steam Wallet Code (Thailand)",
    description: "A demo Steam Wallet code listing for the Thailand region — top up your Steam Wallet balance to purchase games, DLC, and in-game items on Steam. Choose a denomination below.",
    shortDescription: "Steam Wallet Code (THB) — Thailand — Digital product.",
    // Step 59: the Gift Card marketplace's "Steam Wallet" browsing category.
    category: "Steam Wallet",
    productType: "steam-wallet",
    // Step 56 (filter redesign): "Steam" is now a real Platform value —
    // more accurate than the generic "Cross-platform" this used before,
    // since a Steam Wallet top-up genuinely is Steam-specific.
    platform: "Steam",
    region: "Thailand",
    price: convertToUsd(50, "THB"),
    originalPrice: null,
    currency: "USD",
    rating: 4.6,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Steam+Wallet+TH",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=Steam+Wallet+TH"],
    badge: null,
    // Step 59: one of the Gift Card marketplace's Popular Gift Cards.
    isFeatured: true,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
  {
    id: "demo-steam-wallet-global",
    slug: "steam-wallet-global",
    name: "Steam Wallet Code (Global)",
    description: "A demo Steam Wallet code listing for the Global region — top up your Steam Wallet balance to purchase games, DLC, and in-game items on Steam. Choose a denomination below.",
    shortDescription: "Steam Wallet Code (USD) — Global — Digital product.",
    // Step 60 — Steam Wallet & Platform Wallet Expansion: the second
    // Steam Wallet region variant (alongside Thailand above), same
    // "Steam Wallet" Gift Card marketplace category.
    category: "Steam Wallet",
    productType: "steam-wallet",
    platform: "Steam",
    region: "Global",
    price: 5,
    originalPrice: null,
    currency: "USD",
    rating: 4.6,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Steam+Wallet+Global",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=Steam+Wallet+Global"],
    badge: null,
    isFeatured: false,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
  {
    id: "demo-playstation-wallet-thailand",
    slug: "playstation-wallet-thailand",
    name: "PlayStation Store Wallet (Thailand)",
    description: "A demo PlayStation Store wallet top-up listing for the Thailand region — top up your PlayStation Network wallet balance to purchase games, DLC, and subscriptions on the PlayStation Store. Choose a denomination below.",
    shortDescription: "PlayStation Store Wallet (THB) — Thailand — Digital product.",
    // Step 59: the Gift Card marketplace's "PlayStation Store" category.
    category: "PlayStation Store",
    productType: "gift-card",
    platform: "PlayStation",
    region: "Thailand",
    price: convertToUsd(300, "THB"),
    originalPrice: null,
    currency: "USD",
    rating: 4.5,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=PlayStation+Wallet+TH",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=PlayStation+Wallet+TH"],
    badge: null,
    isFeatured: false,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
  {
    id: "demo-xbox-gift-card",
    slug: "xbox-gift-card",
    name: "Xbox Gift Card",
    description: "A demo Xbox Gift Card listing — redeem for games, add-ons, and Xbox Game Pass on the Xbox Store. Choose a denomination below.",
    shortDescription: "Xbox Gift Card (USD) — Global — Digital product.",
    // Step 59: the Gift Card marketplace's "Xbox" category.
    category: "Xbox",
    productType: "gift-card",
    platform: "Xbox",
    region: "Global",
    price: 10,
    originalPrice: null,
    currency: "USD",
    rating: 4.5,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Xbox+Gift+Card",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=Xbox+Gift+Card"],
    badge: null,
    // Step 59: one of the Gift Card marketplace's Popular Gift Cards.
    isFeatured: true,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
  {
    id: "demo-nintendo-eshop-card",
    slug: "nintendo-eshop-card",
    name: "Nintendo eShop Card",
    description: "A demo Nintendo eShop Card listing — redeem for games and DLC on the Nintendo eShop. Choose a denomination below.",
    shortDescription: "Nintendo eShop Card (USD) — Global — Digital product.",
    // Step 59: the Gift Card marketplace's "Nintendo" category.
    category: "Nintendo",
    productType: "gift-card",
    platform: "Nintendo",
    region: "Global",
    price: 10,
    originalPrice: null,
    currency: "USD",
    rating: 4.6,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Nintendo+eShop",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=Nintendo+eShop"],
    badge: null,
    isFeatured: false,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
  {
    id: "demo-google-play-gift-card",
    slug: "google-play-gift-card",
    name: "Google Play Gift Card",
    description: "A demo Google Play Gift Card listing — redeem for apps, games, and in-app purchases on Google Play. Choose a denomination below.",
    shortDescription: "Google Play Gift Card (USD) — Global — Digital product.",
    // Step 59: the Gift Card marketplace's "Google Play" category.
    category: "Google Play",
    productType: "gift-card",
    // Step 59: "Google Play" is now a real Platform value — more accurate
    // than the generic "Cross-platform" this used before, matching the
    // same reasoning Step 56 applied to Steam Wallet.
    platform: "Google Play",
    region: "Global",
    price: 10,
    originalPrice: null,
    currency: "USD",
    rating: 4.4,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Google+Play",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=Google+Play"],
    badge: null,
    // Step 59: one of the Gift Card marketplace's Popular Gift Cards.
    isFeatured: true,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
  {
    id: "demo-apple-gift-card",
    slug: "apple-gift-card",
    name: "Apple Gift Card",
    description: "A demo Apple Gift Card listing — redeem for apps, games, and subscriptions on the App Store and other Apple services. Choose a denomination below.",
    shortDescription: "Apple Gift Card (USD) — Global — Digital product.",
    // Step 59: the Gift Card marketplace's "Apple Gift Card" category.
    category: "Apple Gift Card",
    productType: "gift-card",
    // Step 59: "Apple" is now a real Platform value, same reasoning as
    // Google Play above.
    platform: "Apple",
    region: "Global",
    price: 10,
    originalPrice: null,
    currency: "USD",
    rating: 4.7,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Apple+Gift+Card",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=Apple+Gift+Card"],
    badge: null,
    isFeatured: false,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
  {
    id: "demo-razer-gold",
    slug: "razer-gold",
    name: "Razer Gold",
    description: "A demo Razer Gold listing — a virtual credit used to top up balances and purchase in-game content across many participating games and platforms. Choose a denomination below.",
    shortDescription: "Razer Gold (USD) — Global — Digital product.",
    // Step 59: the Gift Card marketplace's "Other Gift Cards" category.
    category: "Other Gift Cards",
    productType: "game-currency",
    platform: "Cross-platform",
    region: "Global",
    price: 5,
    originalPrice: null,
    currency: "USD",
    rating: 4.3,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Razer+Gold",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=Razer+Gold"],
    badge: null,
    isFeatured: false,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
  {
    id: "demo-garena-shells",
    slug: "garena-shells",
    name: "Garena Shells (Thailand)",
    description: "A demo Garena Shells listing for the Thailand region — a virtual currency used to purchase in-game content across Garena-published games such as Free Fire. Choose a denomination below.",
    shortDescription: "Garena Shells (THB) — Thailand — Digital product.",
    // Step 59: the Gift Card marketplace's "Garena" category.
    category: "Garena",
    productType: "game-currency",
    // Step 59: "Garena" is now a real Platform value, same reasoning as
    // Google Play/Apple above.
    platform: "Garena",
    region: "Thailand",
    price: convertToUsd(30, "THB"),
    originalPrice: null,
    currency: "USD",
    rating: 4.4,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Garena+Shells",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=Garena+Shells"],
    badge: null,
    isFeatured: false,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
  {
    id: "demo-roblox-gift-card",
    slug: "roblox-gift-card",
    name: "Roblox Gift Card",
    description: "A demo Roblox Gift Card listing — redeem for Robux and Premium subscriptions in Roblox. Choose a denomination below.",
    shortDescription: "Roblox Gift Card (USD) — Global — Digital product.",
    // Step 59: the Gift Card marketplace's "Roblox" category.
    category: "Roblox",
    productType: "gift-card",
    platform: "Roblox",
    region: "Global",
    price: 5,
    originalPrice: null,
    currency: "USD",
    rating: 4.5,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Roblox+Gift+Card",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=Roblox+Gift+Card"],
    badge: null,
    // Step 59: one of the Gift Card marketplace's Popular Gift Cards.
    isFeatured: true,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
  {
    id: "demo-gaming-gift-card-universal",
    slug: "universal-gaming-gift-card",
    name: "Universal Gaming Gift Card",
    description: "A demo generic gaming gift card listing — a fictional, non-platform-specific gift card for illustrating the Gift Card marketplace's \"Gaming Gift Cards\" category. Choose a denomination below.",
    shortDescription: "Universal Gaming Gift Card (USD) — Global — Digital product.",
    // Step 59: the Gift Card marketplace's "Gaming Gift Cards" category.
    category: "Gaming Gift Cards",
    productType: "gift-card",
    platform: "Other",
    region: "Global",
    price: 5,
    originalPrice: null,
    currency: "USD",
    rating: 4.2,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Gaming+Gift+Card",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=Gaming+Gift+Card"],
    badge: null,
    isFeatured: false,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
  {
    id: "demo-pc-game-key",
    slug: "pc-game-key",
    name: "PC Game Key",
    description: "A demo PC game key listing — illustrates the game keys category structure.",
    shortDescription: "Demo PC game key.",
    category: "Game Key",
    productType: "game-key",
    platform: "PC",
    region: "Global",
    price: 15,
    originalPrice: null,
    currency: "USD",
    rating: 4.4,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=PC+Game+Key",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=PC+Game+Key"],
    badge: null,
    isFeatured: false,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
  {
    id: "demo-console-bundle",
    slug: "console-starter-bundle",
    name: "Console Starter Bundle",
    description: "A demo console product listing — illustrates the console category structure.",
    shortDescription: "Demo console bundle.",
    category: "Bundle",
    productType: "console",
    platform: "Console",
    region: "Global",
    price: 39.99,
    originalPrice: null,
    currency: "USD",
    rating: 4.2,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Console+Bundle",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=Console+Bundle"],
    badge: null,
    isFeatured: false,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
  {
    id: "demo-game-currency-pack",
    slug: "game-currency-pack",
    name: "Game Currency Pack",
    description: "A demo in-game currency pack listing — illustrates the game currency category structure.",
    shortDescription: "Demo game currency pack.",
    category: "Currency",
    productType: "game-currency",
    platform: "Cross-platform",
    region: "Global",
    price: 9.99,
    originalPrice: null,
    currency: "USD",
    rating: 4.1,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Game+Currency+Pack",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=Game+Currency+Pack"],
    badge: null,
    isFeatured: false,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
  {
    id: "demo-dlc-expansion",
    slug: "dlc-expansion",
    name: "DLC Expansion",
    description: "A demo downloadable content expansion listing — illustrates the DLC category structure.",
    shortDescription: "Demo DLC expansion.",
    category: "Expansion",
    productType: "dlc",
    platform: "PC",
    region: "Global",
    price: 12.99,
    originalPrice: null,
    currency: "USD",
    rating: 4.5,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=DLC+Expansion",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=DLC+Expansion"],
    badge: null,
    isFeatured: false,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
  {
    id: "demo-software-license",
    slug: "software-license",
    name: "Software License",
    description: "A demo software license listing — illustrates the software category structure.",
    shortDescription: "Demo software license.",
    category: "Application",
    productType: "software",
    platform: "PC",
    region: "Global",
    price: 29.99,
    originalPrice: null,
    currency: "USD",
    rating: 4.3,
    reviewCount: 0,
    image: "https://placehold.co/640x400/111111/FFFFFF.png?text=Software+License",
    images: ["https://placehold.co/640x400/111111/FFFFFF.png?text=Software+License"],
    badge: null,
    isFeatured: false,
    isNew: false,
    isOnSale: false,
    stockStatus: "in_stock",
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT,
  },
];
