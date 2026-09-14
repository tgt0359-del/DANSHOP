-- DANSHOP Row Level Security policies (Step 38 §15)
--
-- MIGRATION-READY DESIGN, NOT YET MEANT TO GO LIVE: this project has no
-- real authentication provider wired up yet (see src/lib/auth/README.md /
-- src/lib/users/README.md — every visitor today is an unauthenticated
-- guest). `auth.uid()` will simply be null for every request until a real
-- Supabase Auth integration exists, so enabling these policies now would
-- not "turn on" anything unsafe — but they are written and reviewed as if
-- they will go live verbatim once that integration lands, per Step 38 §15's
-- instruction not to ship a temporary "allow everything" policy.
--
-- No policy here ever exposes another user's profile, orders, payments,
-- wishlist, or recently-viewed rows. See supabase/README.md's "RLS
-- strategy" section for the full reasoning, including why order/payment
-- writes are intentionally NOT covered by a client-side policy at all.

alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table users enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table wishlist_items enable row level security;
alter table recently_viewed_items enable row level security;

-- -------------------------------------------------------------------------
-- Public catalog reading: anyone (including anonymous visitors) can read
-- the catalog — browsing/search/filtering never requires a signed-in user
-- today, and that must stay true once RLS is live (Step 38 §15).
-- -------------------------------------------------------------------------
create policy categories_public_read on categories
  for select using (true);

create policy products_public_read on products
  for select using (true);

create policy product_images_public_read on product_images
  for select using (true);

-- -------------------------------------------------------------------------
-- Admin-only catalog management. UserRole has no permission logic
-- implemented anywhere yet (Step 36 §2) — this policy is the first real
-- consumer of that role field, and only for writes; it changes nothing
-- about the public-read policies above.
-- -------------------------------------------------------------------------
create policy categories_admin_write on categories
  for insert with check (
    exists (select 1 from users where users.id = auth.uid() and users.role = 'admin')
  );
create policy categories_admin_update on categories
  for update using (
    exists (select 1 from users where users.id = auth.uid() and users.role = 'admin')
  );
create policy categories_admin_delete on categories
  for delete using (
    exists (select 1 from users where users.id = auth.uid() and users.role = 'admin')
  );

create policy products_admin_write on products
  for insert with check (
    exists (select 1 from users where users.id = auth.uid() and users.role = 'admin')
  );
create policy products_admin_update on products
  for update using (
    exists (select 1 from users where users.id = auth.uid() and users.role = 'admin')
  );
create policy products_admin_delete on products
  for delete using (
    exists (select 1 from users where users.id = auth.uid() and users.role = 'admin')
  );

create policy product_images_admin_write on product_images
  for insert with check (
    exists (select 1 from users where users.id = auth.uid() and users.role = 'admin')
  );
create policy product_images_admin_update on product_images
  for update using (
    exists (select 1 from users where users.id = auth.uid() and users.role = 'admin')
  );
create policy product_images_admin_delete on product_images
  for delete using (
    exists (select 1 from users where users.id = auth.uid() and users.role = 'admin')
  );

-- -------------------------------------------------------------------------
-- User profile access: a user may read and update only their own row.
-- No public read (a profile carries an email address) and no client-side
-- insert policy — a new row is expected to be created by a trigger on
-- auth.users, not a direct client insert (see supabase/README.md).
-- -------------------------------------------------------------------------
create policy users_select_own on users
  for select using (auth.uid() = id);
create policy users_update_own on users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- -------------------------------------------------------------------------
-- Orders / order_items / payments: a signed-in user may read only their
-- own orders (and, through them, their own order_items/payments). Guest
-- orders (user_id is null) are not selectable through any client-side
-- policy at all — there is no "owner" to check them against.
--
-- IMPORTANT: no insert/update policy exists for orders, order_items, or
-- payments. Order creation and payment/order-status transitions must
-- happen through a trusted server-side path (a Next.js Route Handler or
-- Supabase Edge Function using the service role key, which bypasses RLS
-- entirely) — never directly from the browser. This is what makes guest
-- checkout possible at all (a guest has no auth.uid() to satisfy an
-- ownership check) and what keeps a payment's status trustworthy (Step 34
-- §4's "only a verified server-side confirmation" rule, enforced here at
-- the database layer too, not just in application code).
-- -------------------------------------------------------------------------
create policy orders_select_own on orders
  for select using (auth.uid() = user_id);

create policy order_items_select_own on order_items
  for select using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy payments_select_own on payments
  for select using (
    exists (
      select 1 from orders
      where orders.id = payments.order_id
        and orders.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------------------------
-- Wishlist / recently viewed: fully owned by the signed-in user — unlike
-- orders/payments, these are safe for the client to read AND write
-- directly, since there's no guest-checkout-style trust boundary to
-- protect and nothing here is a financial or historical record.
-- -------------------------------------------------------------------------
create policy wishlist_items_owner_all on wishlist_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy recently_viewed_items_owner_all on recently_viewed_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
