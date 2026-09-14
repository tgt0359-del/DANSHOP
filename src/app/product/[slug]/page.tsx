import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WalletProductView } from "@/components/marketplace/WalletProductView";
import { demoProducts } from "@/data/demoProducts";
import { getVariantsForProduct, hasVariants, productVariants } from "@/data/productVariants";
import { getMarketplaceProducts } from "@/lib/products/productRepository";

/**
 * The wallet/gift-card/top-up product detail route (Step 57 — Wallet/Gift
 * Card Product Detail System). Only ever serves a demo product that has
 * denominations (see `data/productVariants.ts`'s `hasVariants`) — a real
 * catalog game keeps its existing `/games/[slug]` page, and a demo product
 * with no denominations (e.g. "Digital Gift Card") has no card linking
 * here and 404s if visited directly, exactly like a mistyped `/games/`
 * slug already does.
 *
 * Static-generated at build time, same reasoning as `app/games/[slug]/
 * page.tsx`: the demo catalog is small, local, and known ahead of time.
 */
export function generateStaticParams() {
  const productIdsWithVariants = new Set(productVariants.map((variant) => variant.productId));
  return demoProducts
    .filter((product) => productIdsWithVariants.has(product.id))
    .map((product) => ({ slug: product.slug }));
}

function findWalletProduct(slug: string) {
  const product = demoProducts.find((candidate) => candidate.slug === slug);
  if (!product || !hasVariants(product.id)) {
    return undefined;
  }
  return product;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = findWalletProduct(slug);

  if (!product) {
    return {};
  }

  const title = `${product.name} — DANSHOP`;

  return {
    title,
    description: product.description,
    openGraph: {
      title,
      description: product.description,
      siteName: "DANSHOP",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description: product.description,
    },
  };
}

export default async function WalletProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = findWalletProduct(slug);

  if (!product) {
    notFound();
  }

  const variants = getVariantsForProduct(product.id);

  // Same product type, minus itself, capped at 4 — real+demo marketplace
  // catalog only, no invented products (mirrors app/games/[slug]/page.tsx
  // §10's related-products selection).
  const allProducts = await getMarketplaceProducts();
  const relatedProducts = allProducts
    .filter((candidate) => candidate.productType === product.productType && candidate.slug !== product.slug)
    .slice(0, 4);

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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <WalletProductView product={product} variants={variants} relatedProducts={relatedProducts} />
    </>
  );
}
