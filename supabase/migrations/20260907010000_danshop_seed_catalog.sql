-- DANSHOP catalog seed — single-file, manual-application version (Step 39.6)
--
-- WHAT THIS FILE IS: the exact same content as the already-approved
-- `supabase/seed.sql` (Step 38 §17), placed here under supabase/migrations/
-- so it can be pasted and run as one script in the Supabase Dashboard's SQL
-- Editor — the same no-CLI, no-login, no-database-password, no-service-role
-- application path used for the schema migration in Step 39.4/39.5. This is
-- packaging only: it inserts NO product, category, or field that isn't
-- already in `supabase/seed.sql`, which itself mirrors
-- `src/data/games.ts` (the live, authoritative catalog) exactly.
--
-- CROSS-CHECKED FRESH FOR THIS STEP: every one of the 16 products below —
-- name, slug, description, category/genre, platform, price, original
-- price, discount-derived is_on_sale, rating, and the featured/trending/
-- is_new-derived badge and flags — was re-verified field-by-field against
-- the current `src/data/games.ts` as of today. No drift was found; no
-- value was changed. (The `is_new` snapshot is time-sensitive — a 30-day
-- window from a `releaseDate`, the same rule `productAdapter.ts` computes
-- live for the frontend — and was re-confirmed still accurate today: true
-- only for shadow-ember, fractured-realms, and neon-strike.)
--
-- IDEMPOTENT / NON-DESTRUCTIVE: every INSERT below targets a natural
-- unique key already defined by the schema migration —
-- categories(slug), products(slug), product_images(product_id, sort_order)
-- — with ON CONFLICT ... DO NOTHING. Running this file once, twice, or a
-- hundred times produces the exact same 13 categories / 16 products / 16
-- images and never creates a duplicate row. Nothing here is ever UPDATEd
-- or DELETEd, so it can never overwrite or remove existing data — including
-- any real data a future admin adds later, since a duplicate slug is
-- simply skipped rather than replaced.
--
-- NO INVENTED DATA: every product, price, rating, and description below
-- already existed in `src/data/games.ts` before this step; nothing was
-- fabricated to fill a gap. Fields with no 1:1 source in games.ts follow
-- the exact same documented, non-arbitrary rules `supabase/seed.sql` and
-- `src/lib/products/productAdapter.ts` already use — see the inline notes
-- there. No card, payment, credential, or personal-data field exists
-- anywhere in this file.
--
-- SCOPE: this seeds `public.products`, `public.categories`, and
-- `public.product_images` only. It does not touch `users`, `orders`,
-- `order_items`, `payments`, `wishlist_items`, or `recently_viewed_items`,
-- and does not modify any RLS policy, authentication, or payment code.
-- The frontend's local `src/data/games.ts` fallback is untouched and stays
-- fully available — `src/lib/products/productRepository.ts` still falls
-- back to it whenever the live Supabase catalog is empty or unreachable,
-- so nothing here needs to be "verified working" before the site keeps
-- functioning normally.

-- ---------------------------------------------------------------------
-- Categories — one per distinct games.ts `genre` value.
-- ---------------------------------------------------------------------
insert into categories (slug, name) values
  ('action-rpg', 'Action RPG'),
  ('racing', 'Racing'),
  ('strategy', 'Strategy'),
  ('action', 'Action'),
  ('rpg', 'RPG'),
  ('platformer', 'Platformer'),
  ('simulation', 'Simulation'),
  ('puzzle', 'Puzzle'),
  ('adventure', 'Adventure'),
  ('shooter', 'Shooter'),
  ('horror', 'Horror'),
  ('moba', 'MOBA'),
  ('battle-royale', 'Battle Royale')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------
insert into products (
  slug, name, description, short_description, category_id, platform,
  price, original_price, currency, rating, review_count, badge,
  is_featured, is_new, is_on_sale, stock_status
)
values
  (
    'crimson-horizon', 'Crimson Horizon',
    'A sprawling action RPG across a war-torn frontier of five rival factions.',
    'A sprawling action RPG across a war-torn frontier of five rival factions.',
    (select id from categories where slug = 'action-rpg'), 'PC',
    39.99, null, 'USD', 4.6, 0, 'trending', false, false, false, 'in_stock'
  ),
  (
    'nova-drift', 'Nova Drift',
    'Zero-gravity street racing through neon-lit orbital cities.',
    'Zero-gravity street racing through neon-lit orbital cities.',
    (select id from categories where slug = 'racing'), 'PC',
    29.99, 39.99, 'USD', 4.3, 0, 'trending', false, false, true, 'in_stock'
  ),
  (
    'silent-frontier', 'Silent Frontier',
    'Build and defend a colony on a planet that''s always listening back.',
    'Build and defend a colony on a planet that''s always listening back.',
    (select id from categories where slug = 'strategy'), 'PC',
    19.99, 24.99, 'USD', 4.1, 0, null, false, false, true, 'in_stock'
  ),
  (
    'shadow-ember', 'Shadow Ember',
    'A fast, brutal melee combat game set in a collapsing empire.',
    'A fast, brutal melee combat game set in a collapsing empire.',
    (select id from categories where slug = 'action'), 'PC',
    49.99, null, 'USD', 4.7, 0, 'trending', false, true, false, 'in_stock'
  ),
  (
    'skybound-legends', 'Skybound Legends',
    'Free-to-play sky-pirate RPG with co-op airship raids.',
    'Free-to-play sky-pirate RPG with co-op airship raids.',
    (select id from categories where slug = 'rpg'), 'Mobile',
    0, null, 'USD', 4.2, 0, 'trending', false, false, false, 'in_stock'
  ),
  (
    'pixel-raiders', 'Pixel Raiders',
    'A tight, retro-styled platformer built for speedrunners.',
    'A tight, retro-styled platformer built for speedrunners.',
    (select id from categories where slug = 'platformer'), 'PC',
    14.99, null, 'USD', 4.4, 0, null, false, false, false, 'in_stock'
  ),
  (
    'ironclad-siege', 'Ironclad Siege',
    'Command fleets of armored warships in massive naval sieges.',
    'Command fleets of armored warships in massive naval sieges.',
    (select id from categories where slug = 'strategy'), 'PC',
    34.99, 44.99, 'USD', 4.0, 0, null, false, false, true, 'in_stock'
  ),
  (
    'lunar-outpost', 'Lunar Outpost',
    'Manage a growing lunar colony''s power, oxygen, and morale.',
    'Manage a growing lunar colony''s power, oxygen, and morale.',
    (select id from categories where slug = 'simulation'), 'PC',
    24.99, null, 'USD', 3.9, 0, null, false, false, false, 'in_stock'
  ),
  (
    'velvet-nights', 'Velvet Nights',
    'A moody match-three with a noir mystery woven through every level.',
    'A moody match-three with a noir mystery woven through every level.',
    (select id from categories where slug = 'puzzle'), 'Mobile',
    4.99, 6.99, 'USD', 4.5, 0, null, false, false, true, 'in_stock'
  ),
  (
    'fractured-realms', 'Fractured Realms',
    'An open-world adventure across realms that reshape as you explore them.',
    'An open-world adventure across realms that reshape as you explore them.',
    (select id from categories where slug = 'adventure'), 'PC',
    44.99, 59.99, 'USD', 4.8, 0, 'featured', true, true, true, 'in_stock'
  ),
  (
    'steel-vanguard', 'Steel Vanguard',
    'Squad-based tactical shooter with cross-play between PC and mobile.',
    'Squad-based tactical shooter with cross-play between PC and mobile.',
    (select id from categories where slug = 'shooter'), 'PC',
    29.99, 39.99, 'USD', 4.3, 0, 'trending', false, false, true, 'in_stock'
  ),
  (
    'whispering-depths', 'Whispering Depths',
    'A slow-burn survival horror game set in a flooded research station.',
    'A slow-burn survival horror game set in a flooded research station.',
    (select id from categories where slug = 'horror'), 'PC',
    19.99, null, 'USD', 4.6, 0, null, false, false, false, 'in_stock'
  ),
  (
    'arena-clash', 'Arena Clash',
    'Fast 5-minute MOBA matches built for one-handed mobile play.',
    'Fast 5-minute MOBA matches built for one-handed mobile play.',
    (select id from categories where slug = 'moba'), 'Mobile',
    0, null, 'USD', 4.4, 0, 'trending', false, false, false, 'in_stock'
  ),
  (
    'battle-zone-royale', 'Battle Zone Royale',
    '100-player battle royale with a shrinking map that reshapes terrain.',
    '100-player battle royale with a shrinking map that reshapes terrain.',
    (select id from categories where slug = 'battle-royale'), 'Mobile',
    9.99, 14.99, 'USD', 4.1, 0, null, false, false, true, 'in_stock'
  ),
  (
    'tactics-command', 'Tactics Command',
    'Turn-based squad tactics with weekly community-designed maps.',
    'Turn-based squad tactics with weekly community-designed maps.',
    (select id from categories where slug = 'strategy'), 'Mobile',
    6.99, null, 'USD', 4.2, 0, null, false, false, false, 'in_stock'
  ),
  (
    'neon-strike', 'Neon Strike',
    'Twin-stick arcade shooter with roguelike runs through a neon city.',
    'Twin-stick arcade shooter with roguelike runs through a neon city.',
    (select id from categories where slug = 'action'), 'Mobile',
    4.24, 4.99, 'USD', 4.3, 0, 'trending', false, true, true, 'in_stock'
  )
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Product images — one placeholder image per product (sort_order 0),
-- matching each game's existing `image` URL in games.ts exactly. Real
-- artwork isn't rendered from this URL today (GameArtwork generates a
-- deterministic visual client-side instead — see src/lib/gameArtwork.ts)
-- but the URL itself is preserved here rather than dropped or replaced.
-- ---------------------------------------------------------------------
insert into product_images (product_id, image_url, sort_order)
select p.id, v.image_url, 0
from (values
  ('crimson-horizon', 'https://placehold.co/640x400/111111/FFFFFF.png?text=Crimson+Horizon'),
  ('nova-drift', 'https://placehold.co/640x400/111111/FFFFFF.png?text=Nova+Drift'),
  ('silent-frontier', 'https://placehold.co/640x400/111111/FFFFFF.png?text=Silent+Frontier'),
  ('shadow-ember', 'https://placehold.co/640x400/111111/FFFFFF.png?text=Shadow+Ember'),
  ('skybound-legends', 'https://placehold.co/640x400/111111/FFFFFF.png?text=Skybound+Legends'),
  ('pixel-raiders', 'https://placehold.co/640x400/111111/FFFFFF.png?text=Pixel+Raiders'),
  ('ironclad-siege', 'https://placehold.co/640x400/111111/FFFFFF.png?text=Ironclad+Siege'),
  ('lunar-outpost', 'https://placehold.co/640x400/111111/FFFFFF.png?text=Lunar+Outpost'),
  ('velvet-nights', 'https://placehold.co/640x400/111111/FFFFFF.png?text=Velvet+Nights'),
  ('fractured-realms', 'https://placehold.co/640x400/111111/FFFFFF.png?text=Fractured+Realms'),
  ('steel-vanguard', 'https://placehold.co/640x400/111111/FFFFFF.png?text=Steel+Vanguard'),
  ('whispering-depths', 'https://placehold.co/640x400/111111/FFFFFF.png?text=Whispering+Depths'),
  ('arena-clash', 'https://placehold.co/640x400/111111/FFFFFF.png?text=Arena+Clash'),
  ('battle-zone-royale', 'https://placehold.co/640x400/111111/FFFFFF.png?text=Battle+Zone+Royale'),
  ('tactics-command', 'https://placehold.co/640x400/111111/FFFFFF.png?text=Tactics+Command'),
  ('neon-strike', 'https://placehold.co/640x400/111111/FFFFFF.png?text=Neon+Strike')
) as v(slug, image_url)
join products p on p.slug = v.slug
on conflict (product_id, sort_order) do nothing;
