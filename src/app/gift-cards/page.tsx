import type { Metadata } from "next";
import { GiftCardMarketplaceView } from "@/components/giftcards/GiftCardMarketplaceView";
import { allDemoProducts } from "@/data/demoCatalog";
import type { ProductType } from "@/types/product";

export const metadata: Metadata = {
  title: "Gift Cards — DANSHOP",
  description: "Browse and buy demo Steam Wallet, PlayStation Store, Xbox, Nintendo, and other gift cards — demo pricing only.",
  openGraph: { title: "Gift Cards — DANSHOP", siteName: "DANSHOP", type: "website" },
};

/** The Gift Card marketplace's product set (Step 59) — every demo product
 * whose marketplace-level `productType` is a gift-card-family type. This
 * deliberately includes `"steam-wallet"` and `"game-currency"` alongside
 * `"gift-card"` itself: Step 59 §1's own category list names "Steam
 * Wallet" and "Garena" as Gift Card marketplace categories, so this page
 * is a broader, aggregating storefront — the same products still also
 * appear on their existing dedicated category pages (`/steam-wallet`,
 * `/game-currency`), which are completely unaffected by this page
 * existing (see `app/[category]/page.tsx`, unchanged). */
const GIFT_CARD_PRODUCT_TYPES = new Set<ProductType>(["gift-card", "steam-wallet", "game-currency"]);

/**
 * The Gift Card marketplace landing page (Step 59) — a literal static
 * route, a sibling of `app/[category]/page.tsx`'s dynamic segment, the
 * same "a literal folder wins over `[param]`" pattern `app/top-up/
 * page.tsx` already established (see that catch-all's own comment,
 * updated again here). Sources directly from `data/demoCatalog.ts`'s
 * merged demo catalog — this page's whole product set is demo/frontend
 * data, so there is nothing to fetch from Supabase/`getProducts()` here.
 */
export default function GiftCardsPage() {
  const products = allDemoProducts.filter((product) => GIFT_CARD_PRODUCT_TYPES.has(product.productType));

  return <GiftCardMarketplaceView products={products} />;
}
