import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { CategoryPageView } from "@/components/games/CategoryPageView";
import { getCategories, getCategoryBySlug } from "@/data/games";
import { getProductsByCategory } from "@/lib/products/productRepository";

/** Prerender every real category at build time — same reasoning as
 * /games/[slug]'s generateStaticParams: the catalog is small, local, and
 * known ahead of time (Step 44). */
export function generateStaticParams() {
  return getCategories().map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    return {};
  }

  const title = `${category.name} — DANSHOP`;

  return {
    title,
    description: `Browse ${category.name} games on DANSHOP.`,
    openGraph: {
      title,
      siteName: "DANSHOP",
      type: "website",
    },
  };
}

/**
 * Category browsing page (Step 44). Loads products through
 * `getProductsByCategory()` — the same Supabase-primary, local-fallback
 * service layer used everywhere else in `lib/products/` (Step 39/40); this
 * page adds no new data-fetching logic of its own, only a new consumer of
 * what already existed but nothing called (see Step 43's audit finding).
 *
 * The category itself is resolved from the *local* catalog
 * (`getCategoryBySlug`, `data/games.ts`) — matching how `/games/[slug]`
 * resolves the URL param before ever touching Supabase — so an invalid
 * slug 404s immediately via the project's existing `notFound()` →
 * `src/app/not-found.tsx` path (Step 44 §18) without needing a network
 * round-trip first.
 *
 * Stays a Server Component (so generateMetadata/generateStaticParams keep
 * working, matching /games/[slug]'s structure) — all translated strings
 * and rendering live in `CategoryPageView`, a Client Component, the same
 * split /games/[slug] already uses between itself and `GameDetailInfo`.
 */
export default async function CategoryBrowsePage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  const products = await getProductsByCategory(category.name);

  return (
    <div className="py-10 sm:py-12 lg:py-16">
      <Container>
        <CategoryPageView categoryName={category.name} products={products} />
      </Container>
    </div>
  );
}
