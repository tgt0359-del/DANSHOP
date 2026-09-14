import type { Metadata } from "next";
import { GamesCatalog } from "@/components/games/GamesCatalog";
import { getProducts } from "@/lib/products/productRepository";

export const metadata: Metadata = {
  title: "Games — DANSHOP",
  description: "Browse, search, and filter DANSHOP's full game catalog.",
  openGraph: {
    title: "Games — DANSHOP",
    description: "Browse, search, and filter DANSHOP's full game catalog.",
    siteName: "DANSHOP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Games — DANSHOP",
    description: "Browse, search, and filter DANSHOP's full game catalog.",
  },
};

/**
 * Step 48: fetches the catalog through `getProducts()` — Supabase-primary,
 * with the existing local-catalog fallback baked in (Step 39/40) — once,
 * server-side, and hands the result to `GamesCatalog` as a prop. This is
 * the same Server-Component-fetches / Client-Component-filters split
 * `/games/category/[category]/page.tsx` already uses (Step 44); it's what
 * satisfies "use the existing Supabase product data layer" (§23) without
 * needing a browser-side Supabase call for filtering, which is just
 * client-side computation over already-fetched data.
 */
export default async function GamesPage() {
  const products = await getProducts();
  return <GamesCatalog products={products} />;
}
