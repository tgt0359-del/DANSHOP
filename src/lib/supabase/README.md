# Supabase client architecture (Step 39)

This is the first step where DANSHOP may connect to a real Supabase
project. See `supabase/README.md` (Step 38) for the database schema this
connects to.

## Files

- `config.ts` — `getSupabaseEnv()` / `isSupabaseConfigured()`. Reads
  `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`;
  returns `null`/`false` if either is missing rather than throwing, so the
  rest of the app can fall back gracefully (Step 39 §3/§8). Both env vars
  are `NEXT_PUBLIC_` on purpose — see "Why the publishable key is public"
  below.
- `client.ts` — `getSupabaseBrowserClient()`, for Client Components.
  `"use client"`-marked so it can only be bundled into client code. Not
  called by anything today (see "What's actually connected" below).
- `server.ts` — `getSupabaseServerClient()`, for Server Components and
  Route Handlers. Uses `next/headers`'s `cookies()` (required by
  `@supabase/ssr`'s server client shape), even though nothing here sets a
  real session cookie yet — no authentication exists in this project (see
  `src/lib/auth/README.md`).

## Why the publishable key is public

Supabase's security model puts the boundary at Row Level Security, not at
keeping the publishable key secret — that key is *meant* to end up in the
browser bundle, the same way it appears in Supabase's own client-side
quickstart examples. (Supabase's dashboard now calls this the
"publishable" key — `sb_publishable_...` — replacing the older "anon" key
naming; it fills the same role and carries the same public-by-design
status.) What actually protects data is the RLS
policies in `supabase/migrations/20260906120100_row_level_security.sql`:
public read on the catalog, everything else locked to its owner or to a
server-only privileged connection. A `SUPABASE_SERVICE_ROLE_KEY` (which
bypasses RLS entirely) would be a completely different matter — that one
must never be `NEXT_PUBLIC_`-prefixed and must never be imported by
anything a Client Component can pull in. No such key exists anywhere in
this project yet; Step 39 doesn't add one because nothing here needs
elevated privilege (product reads are public by design).

## What's actually connected

Only the product catalog's read path (see `src/lib/products/README.md`),
and only through the server client — `app/games/[slug]/page.tsx` is a
Server Component. The browser client (`client.ts`) exists for
architectural completeness (Step 39 §1 asks for both to exist,
separately) but nothing calls it yet; a future Client Component that
needs a direct read has a safe entry point ready.

## What Step 39 deliberately does not touch

Orders, users, wishlist, recently-viewed, and payments all keep using
their existing localStorage-backed repositories exactly as before (Steps
34/36) — none of them read from or write to Supabase yet. In particular,
**no order or payment write path exists through Supabase** — Step 38's
RLS design already anticipates that those writes will eventually go
through a trusted server-side path using a service-role key, but building
that path is explicitly out of scope here.

## Health check

`GET /api/health/database` (`src/app/api/health/database/route.ts`)
reports one of three states — `not_configured` (200, this project's
normal state right now), `connected` (200), or `unreachable` (503) —
never a raw error, connection string, or credential.
