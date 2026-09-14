import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { CategoryTypeView } from "@/components/marketplace/CategoryTypeView";
import { getMarketplaceCategoryBySlug } from "@/data/marketplaceCategories";
import { getProductsByType } from "@/lib/products/productRepository";

// A literal folder (not `[slug]`), so this wins over the sibling
// /games/[slug] product-detail route for exactly this one path — see
// Step 57 §9's comment in app/[category]/page.tsx for why /games/console
// couldn't just be a param there instead.
const category = getMarketplaceCategoryBySlug("console");

export const metadata: Metadata = category
  ? {
      title: `${category.name} — DANSHOP`,
      description: `Browse ${category.name} on DANSHOP.`,
      openGraph: { title: `${category.name} — DANSHOP`, siteName: "DANSHOP", type: "website" },
    }
  : {};

export default async function ConsoleGamesPage() {
  // Step 61: `productType` is optional on `MarketplaceCategory` now (see
  // that field's own doc comment) — "console" always has one in practice,
  // but this guard makes that a checked invariant rather than an unsound cast.
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
