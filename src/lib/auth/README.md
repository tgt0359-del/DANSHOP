# Authentication architecture (Step 71)

Connects DANSHOP's Account system to real Supabase Authentication, while
keeping guest browsing and guest checkout fully working.

## Files

- `authProvider.ts` — `getAuthProvider()`, the one place that picks
  `supabaseAuthProvider` (a real Supabase project is configured) or
  `guestAuthProvider` (it isn't). Every other file in this app reads the
  current user through this, never by importing one provider directly.
- `supabaseAuthProvider.ts` — the real provider. Thin wrappers around
  Supabase Auth's own `signUp` / `signInWithPassword` / `signOut` /
  `getSession` (the browser, publishable-key-only client —
  `lib/supabase/client.ts` — never the secret/service-role key, which this
  file never imports). Resolves the signed-in `User` profile by reading the
  `users` table row for the session's id.
- `guestAuthProvider.ts` — unchanged in spirit since Step 36: reports "no
  one is signed in" for every query. Used whenever Supabase isn't
  configured, so the app works exactly as it always has out of the box.
- `CurrentUserProvider.tsx` — the one shared, reactive "who is signed in"
  React context, mounted once in `app/layout.tsx`. Subscribes to
  Supabase's `onAuthStateChange` so every consumer (the header's account
  icon, the Account page, `WishlistProvider`, `useOrders`,
  `useRecentlyViewed`) updates together the instant a sign-in/sign-up/
  sign-out completes — no page refresh needed. `hooks/useCurrentUser.ts`
  is a thin `User | null` convenience wrapper over this context.
- `AuthModalProvider.tsx` — the Sign In / Sign Up modal's open/closed
  state, mirroring `lib/settings/SettingsModalProvider.tsx`'s exact
  pattern. The modal itself is `components/auth/AuthModal.tsx`.

## What this step does NOT do

- No custom password/OTP/session storage anywhere — every credential is
  handled entirely by Supabase Auth's own SDK; this codebase's own types
  (`types/user.ts`'s `User`, `types/auth.ts`'s `Session`) never hold one.
- No service-role/secret key anywhere in browser code.
- No admin authentication/authorization UI — `UserRole` (`"customer" |
  "admin"`) exists on the profile row, but nothing reads or enforces it
  client-side; that's a real, separate, future step.
- Cart, checkout, and payment architecture are untouched. Guest checkout
  keeps working exactly as before; the only change is that a placed
  order's `userId` is now the real signed-in user's id when one exists
  (`OrderReviewView.tsx`), instead of always `null`.
- Orders themselves are still local-storage-only, not migrated to
  Supabase (see `supabase/README.md`'s "Order writes are intentionally
  outside RLS" — that's real, separate future work). Wishlist and
  Recently Viewed, however, already had a full Supabase-backed path built
  in Steps 46/47 for exactly this moment — see those directories' own
  repositories, now actually reachable because a real user id exists.

## Database side

`supabase/migrations/20260908000000_danshop_auth_integration.sql` adds
the `on_auth_user_created` trigger the `users` table's own Step 38 comment
already anticipated (a `SECURITY DEFINER` function, the standard Supabase
pattern — not a service-role key, not a client-side privileged write) and
widens `users.preferred_currency`'s CHECK constraint to include `'THB'`
(the app's real display-currency system, `types/currency.ts`, already
supports USD/THB/LAK — the original constraint only allowed the narrower
transactional `USD`/`LAK`). Needs to be applied once via the Supabase
Dashboard's SQL Editor, the same manual path Step 39.4 already established
for this project.
