-- DANSHOP platform value widening (Step 42)
--
-- WHAT THIS FIXES: STEP 41 identified that `products.platform` (Step 38
-- schema) can only hold 'PC' / 'Mobile' / 'Console', while the local,
-- authoritative catalog (`src/data/games.ts`) also has a fourth value,
-- 'PC & Mobile', used by 2 of the 16 products (Silent Frontier, Steel
-- Vanguard). Because the schema couldn't represent it, those 2 products
-- were seeded (Step 39.6) with the lossy, simplified value 'PC' instead of
-- their real platform — this migration corrects that.
--
-- SAFE BY CONSTRUCTION:
--   - The CHECK constraint change is purely ADDITIVE: it widens the set of
--     allowed values (adds 'PC & Mobile') and does not remove or narrow
--     anything. Every row's existing 'PC'/'Mobile' value stays valid.
--   - The UPDATE touches exactly the 2 known-affected rows, identified by
--     their stable `slug` (never their generated `id`), and only ever
--     touches the `platform` column — not price, description, rating,
--     image, category, or any other field (Step 42 §8). It cannot match
--     any other row: the `and platform = 'PC'` guard means a row that has
--     already been corrected (or a future row seeded with the right value
--     from the start) is simply left alone.
--   - No product is deleted, renamed, or has its slug/URL changed
--     (Step 42 §5/§6/§7). No new product is invented (Step 42 §4) — the
--     value 'PC & Mobile' being written already exists verbatim in
--     `src/data/games.ts` today; this migration only makes Supabase agree
--     with data that has been correct in the app's own source of truth all
--     along.
--   - Idempotent: re-running this file is safe. `drop constraint if
--     exists` + `add constraint` produces the same end state whether run
--     once or a hundred times; the `UPDATE ... WHERE ... AND platform =
--     'PC'` matches zero rows on a second run, since by then both rows
--     already read 'PC & Mobile'.
--   - Does not touch RLS, authentication, checkout, orders, or payments —
--     only the `products` table's `platform` column and its constraint.
--
-- NOT APPLIED BY THIS STEP: per Step 42 §11/§22, this file is prepared
-- only. Apply it the same way the Step 39.4/39.6 migrations were applied
-- — paste it into the Supabase Dashboard's SQL Editor — when you're ready.

-- ---------------------------------------------------------------------
-- Widen the platform CHECK constraint to also allow 'PC & Mobile'.
-- ---------------------------------------------------------------------
alter table products drop constraint if exists products_platform_check;
alter table products add constraint products_platform_check
  check (platform in ('PC', 'Mobile', 'Console', 'PC & Mobile'));

-- ---------------------------------------------------------------------
-- Correct the 2 products that were seeded with the simplified 'PC' value
-- instead of their real, richer platform. Matched by slug (stable,
-- human-meaningful) — never by generated id.
-- ---------------------------------------------------------------------
update products
set platform = 'PC & Mobile',
    updated_at = now()
where slug in ('silent-frontier', 'steel-vanguard')
  and platform = 'PC';
