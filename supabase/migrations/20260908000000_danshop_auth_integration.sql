-- DANSHOP Supabase Authentication integration (Step 71)
--
-- WHAT THIS FILE DOES:
--   1. Widens the existing `users.preferred_currency` CHECK constraint to
--      also allow 'THB' — the app's real, existing DISPLAY-currency system
--      (`src/types/currency.ts`'s `CurrencyCode`, Step 56: USD/THB/LAK) was
--      never reflected in this column's constraint, which Step 38 wrote
--      against the older, narrower `src/types/payment.ts` `Currency`
--      ("LAK" | "USD" only — the TRANSACTIONAL currency an order is
--      recorded in, a deliberately separate concept, see that file's own
--      comment). Step 71 §13 explicitly requires an authenticated user's
--      preferred currency to support USD/THB/LAK, so this constraint is
--      widened to match — a non-destructive, additive change (existing
--      'USD'/'LAK' rows are unaffected).
--   2. Adds the `on_auth_user_created` trigger the schema was always
--      designed to receive (see supabase/README.md's "User profile
--      access" section and the `users` table's own comment in
--      20260907000000_danshop_full_schema.sql: "No row-creation
--      policy/trigger is defined here ... see supabase/README.md for the
--      intended on_auth_user_created trigger"). This is the standard,
--      documented Supabase pattern for turning a new `auth.users` row
--      (created by Supabase Auth itself on sign-up) into a matching
--      `public.users` profile row — a `SECURITY DEFINER` function running
--      inside Postgres, triggered server-side by Supabase's own auth
--      system. This is NOT a service-role key, NOT a privileged
--      browser-side write, and NOT a second credential store: the
--      function only ever copies `id`/`email`/a display name into the
--      already-existing, RLS-protected `users` table — no password, OTP,
--      or token is read, stored, or forwarded anywhere.
--
-- NON-DESTRUCTIVE BY CONSTRUCTION: the constraint change only widens what
-- was already allowed (adds 'THB', drops nothing). The trigger function
-- uses `on conflict (id) do nothing`, so it can never overwrite an
-- existing profile, and re-running this file (`create or replace
-- function` + `drop trigger if exists` + `create trigger`) is always a
-- safe no-op.
--
-- HOW TO APPLY: paste this file into the Supabase Dashboard's SQL Editor
-- and run it once — the same manual-application path Step 39.4 already
-- established for this project (no CLI login, no database password, no
-- service-role/secret key needed to apply it). See supabase/README.md.

-- =========================================================================
-- 1. Widen users.preferred_currency to match the real CurrencyCode system
-- =========================================================================
alter table users drop constraint if exists users_preferred_currency_check;
alter table users add constraint users_preferred_currency_check
  check (preferred_currency in ('LAK', 'USD', 'THB'));

-- =========================================================================
-- 2. auth.users -> public.users profile-creation trigger
-- =========================================================================
-- `security definer` is what lets this function insert into `users` even
-- though the table has no client-side INSERT policy (Step 38 §15's
-- deliberate design — "a new row is expected to be created by a database
-- trigger on auth.users insert, not a direct client write"). It runs with
-- the privileges of the function's owner (the database itself), not the
-- new user's own (nonexistent, at signup time) row-level permissions —
-- this is the standard, Supabase-documented way to do this, not a
-- workaround or an RLS bypass for anything the client itself could do.
--
-- Display name: prefers the `display_name` the client passed in
-- `auth.signUp`'s `options.data` (see supabaseAuthProvider.ts), falling
-- back to the email's local-part (everything before "@") if that's ever
-- missing — `users.display_name` is `not null`, so this always produces a
-- real value without inventing a fake name.
--
-- Language/currency default to this schema's existing column defaults
-- ('lo' / 'USD', matching the app's own Lao-default, USD-default
-- behavior for a new guest) — a signed-up user's actual preference is set
-- once they pick one via the existing Settings modal (Step 56).
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, role, preferred_language, preferred_currency)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'customer',
    'lo',
    'USD'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
