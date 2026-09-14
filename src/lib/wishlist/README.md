# Wishlist data layer (Step 46)

Connects DANSHOP's wishlist heart buttons to real, persistent, shared
state — before this step, "wishlist" was a plain per-component
`useState(false)` in `GameCard`/`GameDetailInfo`: never shared between
components, never persisted, reset by every navigation or refresh. None of
that was a deliberate design choice to preserve; it was simply never built
out. This step builds it out, using the same Supabase-primary-with-a-real-
fallback pattern the product catalog already established (Steps 39/40),
extended here for per-user, not just per-catalog, data.

## Files

- `wishlistStore.ts` — the guest/local persistence layer. Stores product
  *slugs* (matching `CartProvider`/`useRecentlyViewed`'s own convention,
  since `slug` is what every product URL and detail page is already keyed
  on) in `localStorage` under `danshop_wishlist`, try/catch guarded exactly
  like `CartProvider.tsx`. `addWishlistSlugLocally` is a no-op if the slug
  is already present — that's what prevents a duplicate guest entry.
- `wishlistSupabaseSource.ts` — the Supabase-backed side, for a real
  authenticated user id. **Uses `getSupabaseBrowserClient()`
  (`lib/supabase/client.ts`), not the server client** — wishlist toggling
  is inherently a client-driven, optimistic-UI interaction (a button
  click), and this is the first real caller `client.ts` was built for back
  in Step 39 ("a future Client Component that needs a direct Supabase
  read"). It resolves slug → `products.id` with its own small query rather
  than importing `lib/products/productRepository.ts`, which is server-only
  (it uses `next/headers`'s `cookies()` and would break if pulled into
  client-side code). Every function returns `null`/`false` on any failure,
  never throws.
- `wishlistRepository.ts` — the service layer / "one seam": `getWishlist`,
  `addToWishlist`, `removeFromWishlist`, all taking a `userId: string |
  null`. `null` (guest — every visitor today) routes to `wishlistStore.ts`;
  a real id routes to `wishlistSupabaseSource.ts`.
- `WishlistProvider.tsx` — a React Context, structurally identical to
  `lib/cart/CartProvider.tsx`: resolves the current user id once via
  `lib/auth/guestAuthProvider.ts` (today, always `null`), loads the
  initial wishlist, and exposes `useWishlist()` (`wishlistedSlugs`,
  `isWishlisted(slug)`, `toggleWishlist(slug)`) to every component. Updates
  are optimistic (instant heart-icon feedback, same feel as the old
  `useState`), reverted only if a Supabase write genuinely fails — the
  local guest path never reports failure, matching `CartProvider`'s own
  "ignore write failures" philosophy.

## Why a failed Supabase read doesn't fall back to local storage

This is the one place this data layer's fallback behavior *differs* from
the product catalog's. `getProducts()` (products) falls back to local data
on failure because the data is the same regardless of source — a sensible
default. A wishlist is per-*person*: if a signed-in user's Supabase read
fails, silently showing whatever's in that browser's local guest storage
would show the wrong data — possibly a different person's earlier,
pre-login browsing on that device. `getWishlist()` degrades a failed
remote read to *empty* instead, never to local data.

## What Step 46 deliberately does not touch

No login/sign-up flow exists (`lib/auth/guestAuthProvider.ts` still always
returns `null` — Step 46 §5/§6 explicitly keep it that way), so
`wishlistSupabaseSource.ts`'s functions are real, correct, and completely
unreachable in this environment today: `userId` is always `null`, every
real visitor uses the local guest store exclusively. This is the same
"prepared but not yet exercised" state Step 33's payment gateway
architecture and Step 39's `client.ts` were left in — the moment a real
auth provider starts returning a real user id, this code activates with no
further change needed here.

No "migrate my guest wishlist into my account on login" flow exists either
— there's no login to trigger it. That's a natural next step once real
authentication exists, not built here.

No card/CVV/OTP/password/secret field exists anywhere in this feature.
Client code uses only the public publishable key
(`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), the same one every other client
Supabase call in this project uses.
