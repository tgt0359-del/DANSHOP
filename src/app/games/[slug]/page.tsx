import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ProductGallery } from "@/components/game-detail/ProductGallery";
import { GameDetailInfo } from "@/components/game-detail/GameDetailInfo";
import { RelatedProducts } from "@/components/game-detail/RelatedProducts";
import { games, getGameBySlug } from "@/data/games";
import { getProductBySlug, getProducts } from "@/lib/products/productRepository";

/** Prerender every existing product at build time — the catalog is small, local, and known ahead of time. */
export function generateStaticParams() {
  return games.map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) {
    return {};
  }

  // Step 40: Supabase is now the primary source for the fields it can
  // represent losslessly (name/description) — `game` (local) is only the
  // fallback if the Supabase-aware read is unavailable for this slug.
  // getProducts() is wrapped in React's cache() (productRepository.ts), so
  // this doesn't cost a second Supabase query beyond the one the page
  // component below also makes for the same request.
  const product = await getProductBySlug(slug);
  const name = product?.name ?? game.title;
  const description = product?.description ?? game.description;

  const title = `${name} — DANSHOP`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "DANSHOP",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

/**
 * Step 51: adds a real image/gallery (`ProductGallery`), stock status,
 * quantity + Buy Now (`GameDetailInfo`), and a Related Products section —
 * all threaded from `product` (Supabase-primary via `getProductBySlug`/
 * `getProducts()`, Step 39/40), the first fields this page actually
 * *renders* from `Product` rather than only using it for metadata/JSON-LD
 * existence-checking. `game` (local) remains the source for the visible
 * platform badge/genre/price/description — see `lib/products/README.md`
 * for why (the `Product.platform` richness gap for "PC & Mobile" products,
 * resolved for filtering in Step 42 but never revisited for this specific
 * page's rendering, so left as-is here per Step 51's narrower scope).
 */
export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  // Step 35/39/40: existence — and, below, the structured-data fields —
  // are resolved through the product service layer (getProductBySlug),
  // which is Supabase-primary with a graceful local fallback
  // (productRepository.ts). `game` (local) remains the source for
  // everything actually RENDERED in the visible component tree
  // (GameArtwork/GameDetailInfo below) — deliberately NOT switched to
  // `product` here: Supabase's `products.platform` column (STEP 38 schema)
  // can only hold 'PC' / 'Mobile' / 'Console', not the richer
  // 'PC & Mobile' value two products need (Silent Frontier, Steel
  // Vanguard) — showing the Supabase-sourced platform badge for those two
  // would be a real, visible regression. Same reasoning the Games page's
  // search/filter/sort already uses to stay on `Game` data — see
  // src/lib/products/README.md.
  const product = await getProductBySlug(slug);
  if (!game || !product) {
    notFound();
  }

  // Step 51 §10: same category, excluding this product, capped at 4 —
  // real catalog products only, resolved through the same Supabase-primary
  // `getProducts()` every other catalog surface uses (Step 39/40/44/48).
  // React's cache() (productRepository.ts) means this doesn't cost a
  // second Supabase round-trip beyond the one getProductBySlug already
  // made for this same request.
  const allProducts = await getProducts();
  const relatedProducts = allProducts
    .filter((candidate) => candidate.category === product.category && candidate.slug !== product.slug)
    .slice(0, 4);

  // Product structured data — Supabase-primary (Step 40): name,
  // description, and price come from `product`, not `game`, so a future
  // edit made directly in Supabase is reflected here without a code
  // change. Deliberately omits image (no real asset yet), aggregateRating
  // (we only have a rating value, not a review count, so a rating schema
  // would be incomplete/misleading), availability, and url (no canonical
  // domain configured) rather than inventing any of them.
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    offers: {
      "@type": "Offer",
      price: product.price.toFixed(2),
      priceCurrency: "USD",
    },
  };

  return (
    <div className="py-10 sm:py-12 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <Container>
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductGallery game={game} images={product.images} />

          <GameDetailInfo game={game} stockStatus={product.stockStatus} />
        </div>

        <RelatedProducts products={relatedProducts} />
      </Container>
    </div>
  );
}
