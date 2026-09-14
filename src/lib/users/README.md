# User & auth architecture (Step 36)

Prepares DANSHOP for a real account system. **No real authentication
exists anywhere in this project** — every visitor is, and remains, a
guest. Everything here is typed scaffolding plus one real "no one is
signed in" implementation, so a real auth provider can be added later
without rewriting the site.

## What exists here

- `src/types/user.ts` — the `User` model and `UserRole`
  (`"customer" | "admin"` — no permission logic exists for either role yet).
- `src/types/auth.ts` — `Session` and the `AuthProvider` interface
  (`getCurrentUser` / `getSession` / `signIn` / `signOut`). No
  password/OTP/token field exists anywhere in either type.
- `lib/auth/guestAuthProvider.ts` — the only provider wired up. Reports
  "no one is signed in" for every query (truthfully — that's every
  visitor's actual state today) and throws on `signIn` (a real attempt to
  sign in with no real provider configured is a genuine error, not
  something to silently ignore).
- `userStore.ts` / `userRepository.ts` — a demo, localStorage-backed
  user-profile store (mirroring `lib/orders/orderStore.ts`'s pattern) with
  `getUserById`, `getUserByEmail`, `createUserProfile`,
  `updateUserProfile`, `deleteUserProfile`. Nothing in the live site calls
  these yet — there's no sign-up flow — but they're real, correct, and
  ready for one.
- `src/hooks/useCurrentUser.ts` — reads `guestAuthProvider.getCurrentUser()`
  reactively; always resolves `null` today. Not wired into any UI (see
  "Account UI" below).

## Language & currency

`User.preferredLanguage` reuses the existing `Locale` type
(`src/lib/i18n/config.ts` — `"lo" | "en" | "th"`) directly, and
`User.preferredCurrency` reuses the existing `Currency` type
(`src/types/payment.ts` — `"LAK" | "USD"`) directly, rather than
duplicating either. No currency conversion exists or is added here.

## Account UI

The header's account icon (`Navbar.tsx`) already exists as a
non-interactive placeholder — no `onClick`, no dropdown, nothing it
claims to do — exactly like the header's Wishlist icon. It's left
untouched by this step: it's already an honest "not implemented yet"
placeholder, so no additional "demo" marking was needed, and Step 36
explicitly asks not to build a full auth page yet.

## Guest compatibility

Nothing in the current site requires signing in — browsing, search,
filters, cart, wishlist, recently viewed, and the entire checkout/order
flow all work exactly as before, unauthenticated. `Order.userId` (Step
34) is already `string | null`, and every order created today passes
`null` — see `OrderReviewView.handlePlaceOrder`, unchanged by this step.

## Preparing user-owned data (not migrated yet)

Cart, wishlist, and recently-viewed all stay anonymous, localStorage-only,
and per-browser exactly as before — Step 36 explicitly asks not to
migrate them to a database or change their persistence. The intended
future shape, once real auth exists:

- `Order.userId` would be set from `useCurrentUser()?.id ?? null` instead
  of the current hardcoded `null` — the type already supports this with
  no change needed.
- Cart/wishlist/recently-viewed would key their storage by the signed-in
  user's id when one exists, falling back to today's anonymous
  localStorage keys for guests — a real migration, deliberately left for
  a later step once there's a real account system to attach data to.

## Security

No field named or shaped like a password, password hash, OTP, card
number, CVV, PIN, bank password, or auth token/secret exists in `User`,
`Session`, or `AuthProvider` — signing in through a real provider would
never route credentials through this codebase's own types at all. No
environment variable is introduced by this step (there's no real provider
to configure yet); when one is, see `.env.example`'s existing pattern
(server-side only, never `NEXT_PUBLIC_`).
