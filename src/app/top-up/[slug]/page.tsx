import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopUpFlowView } from "@/components/topup/TopUpFlowView";
import { topUpGames } from "@/data/topUpGames";
import { getTopUpFieldConfig } from "@/data/topUpFieldConfig";
import { getVariantsForProduct } from "@/data/productVariants";

/** Prerender every Game Top-Up demo game at build time — a small, local,
 * known-ahead-of-time catalog, same reasoning as `app/games/[slug]/
 * page.tsx`'s and `app/product/[slug]/page.tsx`'s own `generateStaticParams`. */
export function generateStaticParams() {
  return topUpGames.map((game) => ({ slug: game.slug }));
}

function findTopUpGame(slug: string) {
  return topUpGames.find((game) => game.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = findTopUpGame(slug);
  if (!game) return {};

  const title = `${game.name} Top Up — DANSHOP`;
  return {
    title,
    description: game.description,
    openGraph: { title, description: game.description, siteName: "DANSHOP", type: "website" },
    twitter: { card: "summary", title, description: game.description },
  };
}

/**
 * The Game Top-Up flow route (Step 58 §3) — resolves one demo game by
 * slug, its package tiers (`data/productVariants.ts`, shared with the
 * wallet system), and its player-information field config
 * (`data/topUpFieldConfig.ts`), then hands all three to the ONE reusable
 * `TopUpFlowView` template. 404s for any slug that isn't one of the 12
 * Game Top-Up demo games — including a real game's slug or a wallet
 * product's slug, which each keep their own separate routes.
 */
export default async function TopUpFlowPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = findTopUpGame(slug);

  if (!game) {
    notFound();
  }

  const variants = getVariantsForProduct(game.id);
  const fieldConfig = getTopUpFieldConfig(game.id);

  // Same category (Mobile Games / PC Games / Console Games / Other Games),
  // minus itself, capped at 4 — real Game Top-Up catalog data only.
  const relatedGames = topUpGames.filter((candidate) => candidate.category === game.category && candidate.slug !== game.slug).slice(0, 4);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: game.name,
    description: game.description,
    offers: {
      "@type": "Offer",
      price: game.price.toFixed(2),
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <TopUpFlowView product={game} variants={variants} fieldConfig={fieldConfig} relatedGames={relatedGames} />
    </>
  );
}
