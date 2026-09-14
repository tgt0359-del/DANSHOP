/**
 * The one shared "does this query match?" rule (Step 52 §4) — used by both
 * the header's search-suggestions dropdown (`Navbar.tsx`, against local
 * `Game` data) and the Games page's own filtering (`GamesCatalog.tsx`,
 * against Supabase-primary `Product` data). Two different data shapes,
 * one identical matching rule, so search never behaves differently
 * depending on which UI surface you're looking at (Step 52 §5).
 *
 * - Case-insensitive, whitespace-trimmed (Step 52 §4).
 * - A substring ("partial") match on any of the given fields — not a
 *   fuzzy/stemmed/scored match, which is what keeps this "not overly
 *   aggressive" (Step 52 §9): a query only ever matches text that
 *   genuinely contains it.
 * - An empty query matches everything (the "handle empty search cleanly"
 *   rule, §4) — callers filtering a list don't need a separate branch for
 *   "no query" vs "query that matches all".
 * - `undefined`/missing fields (e.g. a type that doesn't have a
 *   `shortDescription`) are safely skipped, not treated as a crash.
 */
export function matchesSearchQuery(searchableFields: (string | undefined | null)[], query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (normalized === "") return true;

  return searchableFields.some((field) => typeof field === "string" && field.toLowerCase().includes(normalized));
}
