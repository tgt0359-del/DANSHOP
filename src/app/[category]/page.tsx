import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { CategoryTypeView } from "@/components/marketplace/CategoryTypeView";
import { getMarketplaceCategoryBySlug } from "@/data/marketplaceCategories";
import { getProductsByType } from "@/lib/products/productRepository";

/** The 5 marketplace categories that live at the site root and share this
 * generic implementation (Step 57 §9) — "PC Games"/"Mobile Games"/
 * "Console" are excluded because they're nested under /games (/games/pc,
 * /games/mobile, /games/console); "Game Top Up" is excluded (Step 58)
 * because it has its own dedicated `app/top-up/page.tsx` + `app/top-up/
 * [slug]/page.tsx`; "Gift Cards" is excluded (Step 59) because it has its
 * own dedicated `app/gift-cards/page.tsx` (a real search/Popular-Gift-
 * Cards/category-filter/checkbox-filter-panel marketplace, not this
 * generic grid — individual gift card products still use the existing
 * `/product/<slug>` detail route, Step 57, unchanged). All three cases
 * need their own static route files as siblings of a dynamic route (a
 * literal `/games/pc`, `/top-up`, or `/gift-cards` folder wins over
 * `[category]`/`[slug]` in Next's routing; a param here could not). Every
 * other slug this catch-all receives (a mistyped URL, an unbuilt footer
 * link like /about) correctly falls through to notFound() below,
 * unchanged from before this route existed. */
const STANDALONE_CATEGORY_SLUGS = new Set(["game-keys", "steam-wallet", "game-currency", "dlc", "software"]);

export function generateStaticParams() {
  return [...STANDALONE_CATEGORY_SLUGS].map((category) => ({ category }));
}

function resolveCategory(slug: string) {
  if (!STANDALONE_CATEGORY_SLUGS.has(slug)) return undefined;
  return getMarketplaceCategoryBySlug(slug);
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params;
  const category = resolveCategory(slug);
  if (!category) return {};

  const title = `${category.name} — DANSHOP`;
  return {
    title,
    description: `Browse ${category.name} on DANSHOP.`,
    openGraph: { title, siteName: "DANSHOP", type: "website" },
  };
}

/**
 * Generic marketplace category page (Step 57 §9) — one route handles all
 * 7 standalone categories, resolved through the centralized
 * `marketplaceCategories` registry (Step 57 §2) rather than a page file
 * per category (§19: "do not duplicate page implementations
 * unnecessarily"). Loads products via `getProductsByType()` — real
 * catalog products plus Step 57's demo catalog for types that have no
 * real data yet (see `productRepository.ts`'s `getMarketplaceProducts`).
 * Every one of these 7 categories has zero real products today, so every
 * card here renders with `CategoryTypeView`'s automatic per-product demo
 * detection — the 3 real-game categories (pc/mobile/console) have their
 * own dedicated route files instead (see `app/games/pc/page.tsx` and its
 * siblings), which mostly (or, for console, entirely) render real,
 * non-demo cards through that same detection.
 */
export default async function MarketplaceCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: slug } = await params;
  const category = resolveCategory(slug);

  // Step 61: `productType` is now optional on `MarketplaceCategory` (an
  // aggregator like "Digital Wallets" has no single honest value there —
  // see that field's own doc comment) — every slug this route actually
  // serves still has one, but this guard makes that a real, checked
  // invariant instead of an unsound cast, and 404s cleanly on the
  // (currently impossible) alternative rather than crashing.
  if (!category || !category.productType) {
    notFound();
  }

  const products = await getProductsByType(category.productType);

  return (
    <div className="py-10 sm:py-12 lg:py-16">
      <Container>
        <CategoryTypeView categorySlug={category.slug} products={products} />
      </Container>
    </div>
  );
}
