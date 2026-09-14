import type { Metadata } from "next";
import { SearchResultsView } from "@/components/search/SearchResultsView";
import { getMarketplaceProducts } from "@/lib/products/productRepository";
import { matchesProductQuery } from "@/lib/search/matchesProductQuery";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const title = query ? `Search: ${query} — DANSHOP` : "Search — DANSHOP";

  return {
    title,
    // A live search-results URL isn't a stable, canonical page worth
    // indexing — same reasoning /checkout's own pages already use.
    robots: { index: false, follow: false },
  };
}

/**
 * The marketplace search results page (Step 62 §4) — `/search?q=<query>`,
 * reached from the header's search field pressing Enter, or a suggestion's
 * own "view all results" affordance. `searchParams.q` is the one source
 * of truth for what's shown (a real, shareable/bookmarkable URL, per the
 * step's own example), not the header's live in-memory query — typing a
 * new term in the header updates suggestions immediately as always, but
 * this page's own results only change once that search is actually
 * submitted (Enter, or picking a suggestion), matching how a results page
 * conventionally behaves.
 *
 * Sources from `getMarketplaceProducts()` (Step 57's existing repository
 * function — real games via `getProducts()`, Supabase-primary with local
 * fallback, plus the full demo catalog) — no new data-fetching path, no
 * new API/database dependency (§11).
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const allProducts = await getMarketplaceProducts();
  const results = query === "" ? [] : allProducts.filter((product) => matchesProductQuery(product, query));

  return <SearchResultsView query={query} products={results} />;
}
