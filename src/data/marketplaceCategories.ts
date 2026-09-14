import {
  AppWindow,
  Coins,
  Gamepad,
  Gamepad2,
  Gift,
  KeyRound,
  Monitor,
  Package,
  Smartphone,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ProductType } from "@/types/product";

/** Which of the sidebar's three grouped sections (Step 57 §4) a category
 * belongs to. */
export type MarketplaceCategoryGroup = "shop" | "topup" | "digital";

export interface MarketplaceCategory {
  id: string;
  /** URL-safe slug — not always the last path segment alone (e.g. "pc"
   * for the /games/pc route), but always unique. */
  slug: string;
  /** Full route this category links to. */
  route: string;
  /** Plain English name, used only for page `<title>`/metadata — every
   * other page in this app keeps its `<title>` in English regardless of
   * the visitor's chosen locale (`generateMetadata` runs server-side with
   * no access to the client's i18n choice), matching e.g. "Checkout —
   * DANSHOP". Visible on-page UI uses `nameKey` (translated) instead. */
  name: string;
  /** i18n key for the category's display name (visible UI). */
  nameKey: string;
  /** i18n key for the category's short description (used on its own
   * category page and the homepage discovery cards). */
  descriptionKey: string;
  icon: LucideIcon;
  /** Which `ProductType` this category filters to. `"game"` here means
   * the umbrella "all game-shaped products" case (game + pc-game +
   * mobile-game + console) that the existing /games catalog already
   * shows in full — not a filter restricted to the literal `"game"` type
   * alone (see app/games/page.tsx, unchanged by this step).
   *
   * Optional (Step 61): a category that aggregates ACROSS several
   * `ProductType`s (e.g. "Digital Wallets" — Steam Wallet + Console/
   * Mobile wallet gift cards + game-currency, `app/wallets/page.tsx`) has
   * no single honest value here and omits the field entirely, rather than
   * picking one arbitrarily. `getMarketplaceCategoryByProductType` below
   * already treats a real `ProductType` as never equal to `undefined`, so
   * such an entry is correctly skipped by every existing lookup that
   * resolves "the one category a specific product belongs to" (product
   * detail back-links, search-suggestion fallback links) — nothing about
   * those call sites needed to change. */
  productType?: ProductType;
  group: MarketplaceCategoryGroup;
  /** Whether this category gets a slot in the compact header nav (Step
   * 57 §3 — "do not overcrowd the Header"). Every category still appears
   * in the Sidebar's full grouped list and the homepage discovery
   * section regardless of this flag. */
  showInHeader: boolean;
  enabled: boolean;
}

/**
 * The one centralized marketplace category configuration (Step 57 §2) —
 * Header nav, Sidebar's grouped sections, and the homepage discovery
 * cards all read from this single array instead of each hardcoding their
 * own category list (Step 57 §19's "avoid duplicate category arrays").
 * Order here is the canonical display order for the Sidebar/discovery
 * grid; each consumer filters/reorders as needed for its own surface
 * (e.g. the Header keeps only `showInHeader: true` entries).
 */
export const marketplaceCategories: MarketplaceCategory[] = [
  {
    id: "games",
    slug: "games",
    route: "/games",
    name: "Games",
    nameKey: "productTypes.game",
    descriptionKey: "marketplace.description.games",
    icon: Gamepad2,
    productType: "game",
    group: "shop",
    showInHeader: true,
    enabled: true,
  },
  {
    id: "pc-games",
    slug: "pc",
    route: "/games/pc",
    name: "PC Games",
    nameKey: "productTypes.pcGame",
    descriptionKey: "marketplace.description.pcGame",
    icon: Monitor,
    productType: "pc-game",
    group: "shop",
    showInHeader: true,
    enabled: true,
  },
  {
    id: "mobile-games",
    slug: "mobile",
    route: "/games/mobile",
    name: "Mobile Games",
    nameKey: "productTypes.mobileGame",
    descriptionKey: "marketplace.description.mobileGame",
    icon: Smartphone,
    productType: "mobile-game",
    group: "shop",
    showInHeader: true,
    enabled: true,
  },
  {
    id: "console",
    slug: "console",
    route: "/games/console",
    name: "Console",
    nameKey: "productTypes.console",
    descriptionKey: "marketplace.description.console",
    icon: Gamepad,
    productType: "console",
    group: "shop",
    showInHeader: false,
    enabled: true,
  },
  {
    id: "game-keys",
    slug: "game-keys",
    route: "/game-keys",
    name: "Game Keys",
    nameKey: "productTypes.gameKey",
    descriptionKey: "marketplace.description.gameKey",
    icon: KeyRound,
    productType: "game-key",
    group: "shop",
    showInHeader: false,
    enabled: true,
  },
  {
    id: "steam-wallet",
    slug: "steam-wallet",
    route: "/steam-wallet",
    name: "Steam Wallet",
    nameKey: "productTypes.steamWallet",
    descriptionKey: "marketplace.description.steamWallet",
    icon: Wallet,
    productType: "steam-wallet",
    group: "topup",
    showInHeader: true,
    enabled: true,
  },
  {
    id: "game-topup",
    slug: "top-up",
    route: "/top-up",
    name: "Game Top Up",
    nameKey: "productTypes.gameTopUp",
    descriptionKey: "marketplace.description.gameTopUp",
    icon: Zap,
    productType: "game-topup",
    group: "topup",
    showInHeader: true,
    enabled: true,
  },
  {
    id: "game-currency",
    slug: "game-currency",
    route: "/game-currency",
    name: "Game Currency",
    nameKey: "productTypes.gameCurrency",
    descriptionKey: "marketplace.description.gameCurrency",
    icon: Coins,
    productType: "game-currency",
    group: "topup",
    showInHeader: false,
    enabled: true,
  },
  {
    // Step 61: the Digital Wallets marketplace (`app/wallets/page.tsx`,
    // Step 60) joins the centralized registry so the Header/Sidebar/
    // homepage discovery grid all pick it up automatically like every
    // other category — no more special-cased Sidebar-only link. See
    // `productType`'s own doc comment above for why this entry omits it.
    id: "wallets",
    slug: "wallets",
    route: "/wallets",
    name: "Digital Wallets",
    nameKey: "wallets.pageTitle",
    descriptionKey: "wallets.pageDescription",
    icon: Wallet,
    group: "topup",
    // Header nav already has 8 entries (Step 57's own "do not overcrowd"
    // limit) — Digital Wallets stays Sidebar/homepage-only, same as
    // Console/Game Keys/Game Currency.
    showInHeader: false,
    enabled: true,
  },
  {
    id: "gift-cards",
    slug: "gift-cards",
    route: "/gift-cards",
    name: "Gift Cards",
    nameKey: "productTypes.giftCard",
    descriptionKey: "marketplace.description.giftCard",
    icon: Gift,
    productType: "gift-card",
    group: "digital",
    showInHeader: true,
    enabled: true,
  },
  {
    id: "dlc",
    slug: "dlc",
    route: "/dlc",
    name: "DLC",
    nameKey: "productTypes.dlc",
    descriptionKey: "marketplace.description.dlc",
    icon: Package,
    productType: "dlc",
    group: "digital",
    showInHeader: true,
    enabled: true,
  },
  {
    id: "software",
    slug: "software",
    route: "/software",
    name: "Software",
    nameKey: "productTypes.software",
    descriptionKey: "marketplace.description.software",
    icon: AppWindow,
    productType: "software",
    group: "digital",
    showInHeader: true,
    enabled: true,
  },
];

export function getMarketplaceCategories(): MarketplaceCategory[] {
  return marketplaceCategories.filter((category) => category.enabled);
}

export function getHeaderMarketplaceCategories(): MarketplaceCategory[] {
  return getMarketplaceCategories().filter((category) => category.showInHeader);
}

export function getMarketplaceCategoriesByGroup(group: MarketplaceCategoryGroup): MarketplaceCategory[] {
  return getMarketplaceCategories().filter((category) => category.group === group);
}

/** Resolves a category by its route's final slug segment — used by the
 * generic `/[category]` route (Step 57 §9) for the 7 standalone
 * categories that aren't nested under `/games`. */
export function getMarketplaceCategoryBySlug(slug: string): MarketplaceCategory | undefined {
  return getMarketplaceCategories().find((category) => category.slug === slug);
}

/** Resolves the one category a given `ProductType` maps to — used by the
 * header search suggestions (Navbar.tsx) to link a demo product (which
 * has no individual detail page) to its real category listing instead. */
export function getMarketplaceCategoryByProductType(productType: ProductType): MarketplaceCategory | undefined {
  return getMarketplaceCategories().find((category) => category.productType === productType);
}
