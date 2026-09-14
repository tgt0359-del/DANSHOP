# Product data layer (Step 35, connected to Supabase in Step 39, Supabase made primary for product-detail-by-slug in Step 40)

This directory prepares DANSHOP's catalog for a real database. **The
local `src/data/games.ts` catalog is still fully intact and is still the
fallback data source — nothing here deletes or bypasses it.**

## What exists here

- `src/types/product.ts` — the formal, backend-ready `Product` shape
  (`id`, `slug`, `name`, `category`, `platform`, `stockStatus`,
  `reviewCount`, `createdAt`/`updatedAt`, etc.), plus `Platform`,
  `StockStatus`, and `ProductCategory`.
- `productAdapter.ts` — `gameToProduct(game)`, the compatibility layer
  that converts an existing `Game` into a `Product`. Still used as the
  fallback path — see below.
- `productSupabaseSource.ts` (Step 39) — `fetchProductsFromSupabase()`,
  the only place in this project that queries the `products` table. Joins
  `categories` (Step 39 §7) and `product_images` (Step 39 §6) through
  their real foreign-key relationships (see `supabase/migrations/`) and
  maps every snake_case column onto the existing camelCase `Product`
  shape — no component anywhere had to change to accommodate this.
  Returns `null` if Supabase isn't configured or the read fails for any
  reason; never throws, never logs a full error object or credential.
- `productRepository.ts` — the service layer: `getProducts`,
  `getProductById`, `getProductBySlug`, `getFeaturedProducts`,
  `getNewProducts`, `getDiscountedProducts`, `getProductsByCategory`,
  `getProductsByPlatform`, `searchProducts`. All are `async` as of Step
  39: `getProducts()` tries `fetchProductsFromSupabase()` first and falls
  back to `games.map(gameToProduct)` if that returns `null` **or an empty
  array** (a configured-but-unseeded project shouldn't make the site look
  broken — see `supabase/seed.sql`). Every other function already derived
  its result from `getProducts()` before Step 39 (Step 35's own design)
  and needed no logic change at all beyond adding `async`/`await` — one
  seam gave the whole repository Supabase support.

## Data-fetching approach (Step 39 §10, revisited Step 40)

`getSupabaseServerClient()` is still created fresh per request (it needs
that request's cookies, even though nothing here uses them for auth yet).
As of Step 40, `getProducts()` is wrapped in React's `cache()` — the
per-request dedup mechanism this README's Step 39 version flagged as "the
natural next step... if Supabase is queried from more call sites", which
is now true: the product detail page calls `getProductBySlug()` from both
`generateMetadata` and the page component for the same request. `cache()`
means that costs one Supabase query per page load, not two — it does not
persist or share anything *across* requests, so it's not the kind of
caching layer that risks showing stale data during manual testing (the
concern Step 39 was avoiding). No other caching was added.

## UI never talks to Supabase directly

Every consumer (today: `app/games/[slug]/page.tsx`) calls
`productRepository.ts`, never `productSupabaseSource.ts` or
`lib/supabase/*` directly (Step 39 §5). That's what keeps the
Supabase-vs-local decision in exactly one place.

## What still uses `Game`/`data/games.ts` directly, and why

Every existing page and component (`GameCard`, `GamesCatalog`, the
homepage listing sections, `CartDrawer`, `useCheckoutLines`,
`useRecentlyViewed`) keeps reading `Game`/`games` exactly as before, and
so does `GameDetailInfo`/`GameArtwork` — the product detail page's
*visible* component tree (Step 40 kept this unchanged; see "Product
detail pages" below for exactly what Step 40 did change on that page).
Two reasons:

1. **No regression risk.** These are already-correct, already-tested
   pieces of an approved, working catalog. Rewriting their internals to
   consume `Product` instead would be a real rewrite for no user-visible
   benefit at this stage — exactly what Step 35 asks not to do
   ("do not change the visual design unnecessarily", "keep all existing
   product pages and catalog behavior working").

2. **A real data-shape difference — fixed at the code/type level in Step
   42, but not yet live.** Before Step 42, `Platform` (this layer) was a
   plain 3-value enum (`PC` / `Mobile` / `Console`) with no way to
   represent "both" — unlike the existing, more precise `GamePlatform`
   (`PC` / `Mobile` / `PC & Mobile`), forcing `productAdapter.ts` to
   simplify combined-platform games down to `"PC"`. STEP 41 identified
   this as the specific blocker; **STEP 42 resolves it**: `Platform` now
   includes `"PC & Mobile"` (see `types/product.ts`), `productAdapter.ts`'s
   `mapPlatform()` is now a lossless identity mapping, and
   `supabase/migrations/20260907020000_danshop_platform_widen.sql` widens
   the live schema's `products_platform_check` constraint and corrects the
   2 affected rows (Silent Frontier, Steel Vanguard) to their real value.

   **That migration has not been applied yet** (Step 42 §11/§22 — prepared
   only). Until it is, Supabase's live `products.platform` for those 2
   products still reads the old, simplified `"PC"` — so `GamesCatalog`'s
   search/filter/sort logic and `GameDetailInfo`'s platform badge
   **continue to deliberately read the real `Game` data**, not
   `searchProducts()` / `getProductsByPlatform()` / a Supabase-sourced
   `product.platform`, exactly as Step 40 decided. Once the migration is
   applied, the data-model blocker Step 40 cited will be gone — whether to
   then actually switch those UI pieces over is a separate decision for a
   future step, not automatic.

## A side-effect worth knowing about (Step 42)

`searchProducts()` and `getProductsByPlatform()` (`productRepository.ts`)
were already written to match/filter against `product.platform` directly
— they needed no code change for Step 42. Once the widening migration
above is applied, they'll automatically start matching "PC & Mobile"
products correctly too (e.g. `searchProducts("mobile")` will include Steel
Vanguard) — they just weren't reachable from anywhere that mattered until
the underlying data was correct, since nothing in the live UI calls them
today (see "What still uses `Game`/`data/games.ts` directly, and why").

## Catalog taxonomy expansion (Step 54)

Step 54's goal was architecture, not new catalog data: DANSHOP's `Product`
model can now classify a product along three axes, each already resolved
for every real product today:

- **`ProductType`** (`types/product.ts`) — the marketplace's top-level
  section (Games, Game Cards, Gift Cards, Steam Wallet, Game Top Up, DLC,
  Software, Subscriptions, Game Points, Mobile Top Up). Distinct from
  `category` (a genre like Action/RPG, meaningful mostly within Games).
  Every real product is `"game"` today (set in `productAdapter.ts` and
  `productSupabaseSource.ts`) — an honest value, not a placeholder, since
  every product actually is one. `data/productTypes.ts` is the display
  registry (slug + translation key per type) a future nav/filter reads
  instead of hardcoding the list — the same role `data/games.ts`'s
  `getCategories()` plays for genres. `productRepository.ts`'s new
  `getProductsByType()` mirrors `getProductsByCategory`/
  `getProductsByPlatform` exactly.
- **`Platform`** gained `"Cross-platform"`, for a future product that
  isn't tied to a device at all (a gift card, a subscription) — distinct
  from `"PC & Mobile"` ("works on both"). No real product uses it.
- **`Region`** (new) — `"Global" | "Thailand" | "Laos"`. Every real
  product is `"Global"` — DANSHOP has no region-locked inventory, so this
  reflects reality rather than inventing one.

`platformLabels.ts`/`regionLabels.ts` add `Record<Platform, string>`/
`Record<Region, string>` translation-key maps (mirroring
`lib/orders/orderStatusLabels.ts`'s established pattern) so a future
filter has real copy ready in Lao/Thai/English without another
localization pass.

**No Supabase migration was made for this step.** The live `products`
table has no `product_type` or `region` column, and Step 54 §9 is explicit
that a schema change should only happen if "genuinely required" — it
isn't, because no non-game product is being seeded here (§10: "prepare the
system architecture", not add fake catalog data). Adding those columns now
would mean guessing their real shape (nullable? a CHECK-constrained enum
matching `ProductType`'s 10 values, or a `product_types` table like
`categories`?) before any real product exists to seed and validate it.
`productSupabaseSource.ts` sets `productType: "game"` / `region: "Global"`
for every row it maps — accurate for every row that exists, since only
games have ever been seeded — with a comment marking this as the thing to
revisit once real non-game catalog data is actually being added.

The existing genre `category` system (`getCategories()`/
`getCategoryBySlug()` in `data/games.ts`, the `/games/category/[category]`
route, `GamesCatalog`'s category filter) needed **no changes** — it was
already derived dynamically from the live catalog (`ProductCategory` is
already a plain, open `string` type) rather than hardcoded, so it was
already exactly as extensible as Step 54 asks for.

## One place that already agrees without any code change

`Order.items` (see `src/types/order.ts`, Step 34) stores
`productId`/`productSlug`/`productName` — populated in
`OrderReviewView` from `line.game.id`/`slug`/`title`. Since
`gameToProduct` maps `Game.id → Product.id`, `Game.slug → Product.slug`,
and `Game.title → Product.name` unchanged, an order's item identifiers
are already the same values `Product.id`/`Product.slug`/`Product.name`
would be — no migration needed there.

## Product detail pages

`app/games/[slug]/page.tsx` resolves existence through
`await getProductBySlug()` (Step 35 §5) in addition to its existing
`getGameBySlug()` call for the actual `Game` used to render the visible
page. As of Step 39, `getProductBySlug()` is a real (Supabase-or-fallback)
read — this is the first place in the app where a genuine Supabase query
happens.

As of **Step 40**, Supabase is the primary source for the parts of this
page that don't have the platform-richness gap described above:
`generateMetadata`'s `<title>`/OpenGraph/Twitter tags, and the page's
Product JSON-LD structured data (`name`/`description`/`price`), now come
from the fetched `product` (Supabase-primary), not `game`. Those fields
are — and always have been, verified byte-for-byte during Step 39.6/39.8's
seeding — identical between the two sources for all 16 products, so
nothing changes today; the real effect is forward-looking: if a product's
name, description, or price is ever edited directly in Supabase, this
metadata/structured-data will reflect that edit without a code change.

`game` (from `getGameBySlug`, still local/synchronous) remains the source
for everything in the visible component tree — `GameArtwork`'s `genre`
prop and, especially, `GameDetailInfo`'s platform badge, per the
platform-richness reasoning above. So the two calls can report different
*sources* for different fields but never disagree on whether the slug is
real, since both are ultimately checking the same 16 slugs either way.
