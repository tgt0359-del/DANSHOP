-- DANSHOP initial schema (Step 38)
--
-- Design/migration-preparation only. This file is not executed against any
-- live project as part of this step — see supabase/README.md for the full
-- architecture writeup, guest-checkout handling, and order-history/payment
-- security reasoning behind the choices below.
--
-- Safe to run any number of times against a fresh database: every
-- statement uses IF NOT EXISTS / OR REPLACE and nothing here drops or
-- deletes existing data.

create extension if not exists pgcrypto;

-- =========================================================================
-- categories
-- =========================================================================
-- One row per product genre/category (see src/types/product.ts's
-- ProductCategory). Kept as its own table rather than a free-text column
-- on every product, per Step 38 §6.
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_key unique (slug)
);

-- =========================================================================
-- users
-- =========================================================================
-- A profile-extension table, NOT a credential store: `id` references
-- Supabase Auth's own `auth.users`, which is where any future real
-- authentication provider owns email/password/session/token data. This
-- table only ever holds the fields the app's existing User model (Step 36)
-- needs to display/preference — never a password, password hash, OTP, or
-- any other credential (Step 38 §3, §10).
--
-- No row-creation policy/trigger is defined here (that's an
-- authentication-integration concern, out of scope for this step) — see
-- supabase/README.md for the intended `on_auth_user_created` trigger this
-- table is designed to receive once a real provider exists.
create table if not exists users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_url text,
  role text not null default 'customer',
  preferred_language text not null default 'lo',
  preferred_currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_key unique (email),
  constraint users_role_check check (role in ('customer', 'admin')),
  constraint users_preferred_language_check check (preferred_language in ('lo', 'en', 'th')),
  constraint users_preferred_currency_check check (preferred_currency in ('LAK', 'USD'))
);

-- =========================================================================
-- products
-- =========================================================================
-- Matches src/types/product.ts's Product model. Deliberately has no
-- `image`/`images` column — see product_images below (Step 38 §5) — the
-- "primary" image is the product_images row with the lowest sort_order.
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text not null,
  short_description text not null,
  category_id uuid not null references categories (id) on delete restrict,
  platform text not null,
  price numeric(10, 2) not null,
  -- Nullable: null means "not discounted" (see Product.originalPrice in
  -- src/types/product.ts, which is nullable for the same reason — unlike
  -- the older Game type, which instead repeats `price` here).
  original_price numeric(10, 2),
  currency text not null default 'USD',
  rating numeric(2, 1) not null default 0,
  -- No real review system exists yet — always 0 rather than a fabricated
  -- number (matches productAdapter.ts's own documented reasoning).
  review_count integer not null default 0,
  badge text,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_on_sale boolean not null default false,
  stock_status text not null default 'in_stock',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_key unique (slug),
  constraint products_platform_check check (platform in ('PC', 'Mobile', 'Console')),
  constraint products_badge_check check (badge is null or badge in ('featured', 'trending')),
  constraint products_stock_status_check check (stock_status in ('in_stock', 'low_stock', 'out_of_stock')),
  constraint products_currency_check check (currency in ('LAK', 'USD')),
  constraint products_price_check check (price >= 0),
  constraint products_original_price_check check (original_price is null or original_price >= price),
  constraint products_rating_check check (rating >= 0 and rating <= 5),
  constraint products_review_count_check check (review_count >= 0)
);

-- =========================================================================
-- product_images
-- =========================================================================
create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_images_sort_order_check check (sort_order >= 0)
);

-- One image can't claim the same position twice for the same product.
create unique index if not exists product_images_product_sort_key
  on product_images (product_id, sort_order);

-- =========================================================================
-- orders
-- =========================================================================
-- Matches src/types/order.ts's Order model (Step 34). `user_id` is
-- nullable specifically so guest checkout — the app's only checkout path
-- today — remains fully supported (Step 38 §7); `on delete set null`
-- means a deleted user account never destroys their past orders, it just
-- anonymizes them the same way a guest order already looks.
--
-- Customer info is flattened (customer_full_name/customer_email) rather
-- than normalized into a separate customers table: there is no reliable,
-- durable "customer" identity to normalize against for a guest, so this
-- is a point-in-time snapshot belonging to the order, not a managed entity.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null,
  user_id uuid references users (id) on delete set null,
  customer_full_name text not null,
  customer_email text not null,
  subtotal numeric(10, 2) not null,
  discount numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  currency text not null default 'USD',
  -- Deliberately no CHECK constraint enumerating specific payment method
  -- names: src/types/payment.ts's PaymentMethodId already exists as the
  -- application-level source of truth for the current 8 methods, and a
  -- second, rigid DB-level enum here would need a migration every time the
  -- UI's method list changes — the same reasoning the app's own Order type
  -- already uses (paymentMethod: string, not a literal union).
  payment_method text not null,
  payment_status text not null default 'pending',
  order_status text not null default 'pending_payment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_order_reference_key unique (order_reference),
  constraint orders_currency_check check (currency in ('LAK', 'USD')),
  constraint orders_payment_status_check
    check (payment_status in ('pending', 'processing', 'paid', 'failed', 'cancelled', 'expired')),
  constraint orders_order_status_check
    check (order_status in ('pending_payment', 'paid', 'processing', 'completed', 'cancelled', 'refunded')),
  constraint orders_subtotal_check check (subtotal >= 0),
  constraint orders_discount_check check (discount >= 0),
  constraint orders_total_check check (total >= 0)
);

-- =========================================================================
-- order_items
-- =========================================================================
-- product_id uses `on delete set null` — NOT cascade, NOT restrict. This
-- is the important historical-safety decision Step 38 §8/§13 ask for:
--   - cascade would silently delete order history when a product is removed.
--   - restrict would make a product impossible to ever delete once ordered.
--   - set null preserves the order_item row and its snapshot fields
--     (product_name/product_slug/unit_price/total_price, captured at order
--     time — see src/types/order.ts's OrderItem, which already snapshots
--     these for exactly this reason) even after the live product is gone.
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  product_name text not null,
  product_slug text not null,
  quantity integer not null,
  unit_price numeric(10, 2) not null,
  total_price numeric(10, 2) not null,
  constraint order_items_quantity_check check (quantity > 0),
  constraint order_items_unit_price_check check (unit_price >= 0),
  constraint order_items_total_price_check check (total_price >= 0)
);

-- =========================================================================
-- payments
-- =========================================================================
-- Matches src/types/payment.ts's PaymentSession (Step 33). Deliberately
-- excludes any card/CVV/PIN/OTP/bank-password/secret field — see
-- supabase/README.md's "Payment security boundaries" section. `status`
-- uses the payment PROVIDER's own uppercase vocabulary (matching
-- PaymentStatus in payment.ts), distinct from orders.payment_status, which
-- uses DANSHOP's own lowercase vocabulary (OrderPaymentStatus) — the two
-- are related but intentionally not the same column (Step 34's
-- mapPaymentStatusToOrderPaymentStatus is what would translate one into
-- the other).
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  provider text not null,
  payment_reference text not null,
  payment_method text not null,
  amount numeric(10, 2) not null,
  currency text not null,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_payment_reference_key unique (payment_reference),
  constraint payments_provider_check check (provider in ('manual', 'bcel', 'paypal')),
  constraint payments_status_check
    check (status in ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED')),
  constraint payments_currency_check check (currency in ('LAK', 'USD')),
  constraint payments_amount_check check (amount >= 0)
);

-- =========================================================================
-- wishlist_items
-- =========================================================================
-- Unlike orders, both FKs cascade: a wishlist entry has no historical
-- value once its owner or its product is gone (Step 38 §10).
create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint wishlist_items_user_product_key unique (user_id, product_id)
);

-- =========================================================================
-- recently_viewed_items
-- =========================================================================
-- The unique(user_id, product_id) constraint is what makes "viewing a
-- product again" naturally become an upsert (bump viewed_at) instead of a
-- duplicate row — the same "move to front, no duplicates" behavior
-- src/hooks/useRecentlyViewed.ts already implements client-side today
-- (Step 38 §11). The frontend's cap of 6 stays an application-layer
-- concern (e.g. trimming to the 6 most recent rows per user on write),
-- not a DB constraint — see supabase/README.md.
create table if not exists recently_viewed_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  constraint recently_viewed_items_user_product_key unique (user_id, product_id)
);

-- =========================================================================
-- Indexes (Step 38 §14)
-- =========================================================================
-- products.slug, categories.slug, orders.order_reference, and
-- payments.payment_reference are already indexed via their UNIQUE
-- constraints above — Postgres creates a unique index automatically for
-- every UNIQUE constraint, so no separate CREATE INDEX is needed for those.

create index if not exists products_category_id_idx on products (category_id);
create index if not exists products_platform_idx on products (platform);
-- Partial indexes: each flag is true for a small minority of rows, so a
-- full index would waste space indexing every `false` row too.
create index if not exists products_is_featured_idx on products (is_featured) where is_featured;
create index if not exists products_is_new_idx on products (is_new) where is_new;
create index if not exists products_is_on_sale_idx on products (is_on_sale) where is_on_sale;

create index if not exists orders_user_id_idx on orders (user_id);
create index if not exists orders_created_at_idx on orders (created_at);

create index if not exists order_items_order_id_idx on order_items (order_id);

create index if not exists payments_order_id_idx on payments (order_id);

create index if not exists wishlist_items_user_id_idx on wishlist_items (user_id);

create index if not exists recently_viewed_items_user_id_idx on recently_viewed_items (user_id);
create index if not exists recently_viewed_items_viewed_at_idx on recently_viewed_items (viewed_at);
