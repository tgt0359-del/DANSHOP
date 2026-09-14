import type { Metadata } from "next";
import { WalletMarketplaceView } from "@/components/wallets/WalletMarketplaceView";
import { allDemoProducts } from "@/data/demoCatalog";
import { getWalletGroup } from "@/lib/products/walletGroups";

export const metadata: Metadata = {
  title: "Digital Wallets — DANSHOP",
  description: "Browse demo Steam Wallet, console, mobile/app, and gaming-credit wallet top-ups — demo pricing only.",
  openGraph: { title: "Digital Wallets — DANSHOP", siteName: "DANSHOP", type: "website" },
};

/**
 * The Digital Wallets marketplace landing page (Step 60 — Steam Wallet &
 * Platform Wallet Expansion) — a literal static route, a sibling of
 * `app/[category]/page.tsx`'s dynamic segment, the same "a literal folder
 * wins over `[param]`" pattern `app/gift-cards/page.tsx`/`app/top-up/
 * page.tsx` already established. Sources from `data/demoCatalog.ts`'s
 * merged demo catalog, keeping only products `lib/products/walletGroups.ts`'s
 * `getWalletGroup` actually resolves to one of the 4 named wallet families —
 * this is what excludes the generic, no-single-platform "Digital Gift
 * Card" placeholder while still including every real Steam/console/
 * mobile/gaming-credit product, whether its `productType` is
 * `"steam-wallet"`, `"gift-card"`, or `"game-currency"`.
 */
export default function WalletsPage() {
  const products = allDemoProducts.filter((product) => getWalletGroup(product) !== undefined);

  return <WalletMarketplaceView products={products} />;
}
