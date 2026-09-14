# Recently-viewed data layer (Step 47)

Connects DANSHOP's "Recently Viewed" row to the real `recently_viewed_items`
table using the exact same Supabase-primary-for-a-real-user,
local-guest-fallback pattern Step 46 established for wishlist — extended
here for "record a view" (upsert-and-bump) semantics instead of a toggle.

## Files

- `recentlyViewedStore.ts` — the guest/local persistence layer. This is
  the same `danshop_recently_viewed` `localStorage` key, move-to-front,
  cap-at-6 logic that previously lived directly inside
  `hooks/useRecentlyViewed.ts` — extracted here so the hook can route
  through the same repository seam Step 46 used, without changing the
  storage format (existing browsers' stored data still reads correctly).
- `recentlyViewedSupabaseSource.ts` — the Supabase-backed side, for a real
  authenticated user id. Uses `getSupabaseBrowserClient()` (not the server
  client — recording a view fires from a Client Component's effect, the
  same reasoning Step 46's wishlist used for `client.ts`). `record...()`
  upserts on the table's existing `recently_viewed_items_user_product_key`
  unique constraint **without** `ignoreDuplicates` (unlike wishlist's
  upsert) — a repeat view *should* update `viewed_at`, moving the product
  to the front, which is exactly what Step 38's schema comment already
  described this constraint as being for. After upserting, it also trims
  any rows beyond the 6 most recent for that user — the 6-item cap is an
  application-layer concern (see `supabase/README.md`), not a database
  constraint, so the write side enforces it the same way the local guest
  store's array-slicing always has, rather than only capping what's
  displayed.
- `recentlyViewedRepository.ts` — the service layer: `getRecentlyViewedSlugs`,
  `recordRecentlyViewedSlug`, both taking `userId: string | null`. `null`
  (guest — every visitor today) → local store; a real id → Supabase. A
  failed Supabase read degrades to empty, never to local data — the same
  reasoning Step 46 documented: a signed-in user's history is their own,
  not whatever a shared browser's local guest storage happens to hold.

## `hooks/useRecentlyViewed.ts` — same public API, new internals

`recordRecentlyViewed(slug)` and `useRecentlyViewed(): Game[]` keep their
exact pre-Step-47 signatures and call sites — `GameDetailInfo.tsx` and
`components/games/RecentlyViewed.tsx` needed **zero changes** (Step 47
§15/§17). Internally, the hook now resolves the current user id via
`lib/auth/guestAuthProvider.ts` (today, always `null`) and routes through
`recentlyViewedRepository.ts` instead of reading `localStorage` directly.
Stale-slug filtering (a stored slug that no longer matches a real product)
is preserved exactly as before, and — like Step 46's wishlist — only
matters for the guest path: a Supabase-sourced slug can never be stale,
since `recently_viewed_items.product_id` cascades away with its product.

## What Step 47 deliberately does not touch

Same as Step 46: no login/sign-up flow exists, so the Supabase-backed
functions here are real and correct but completely unreachable today —
`userId` is always `null`. See Step 46's wishlist README for the fuller
version of this reasoning; it applies identically here.
