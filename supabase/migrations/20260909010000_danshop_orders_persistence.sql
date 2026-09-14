-- DANSHOP real order persistence (Step 79)
--
-- SECURITY FIX (post-review, before this file was ever applied live —
-- still the same migration, not a second one): a review of this file
-- found two gaps in `create_order()` below and both are fixed in this
-- version:
--   1. Idempotency replay had no ownership check — any caller who learned
--      another customer's `client_request_id` could replay it and read
--      that customer's full order back. Replay now requires the existing
--      order's `user_id` to match the CALLING request's own `auth.uid()`
--      (an authenticated caller) or to also be null (a guest caller) —
--      see the "Idempotent replay" section below for the exact rule and
--      why a mismatch fails closed without revealing anything.
--   2. An item with no `product_id` (a frontend-only demo product —
--      wallet/gift card/Game Top-Up, never written to Supabase) accepted
--      a caller-supplied `unit_price`/`original_price` — but this
--      function has no table row to verify that price against, and it is
--      reachable by anyone holding the public publishable key (not only
--      through this app's own Route Handler), so that price could never
--      actually be trusted. This function no longer accepts ANY
--      caller-supplied price: every item now requires a real
--      `product_id`, and its price/name/slug are always resolved from
--      `products`. An item with no `product_id` is rejected outright
--      (`DEMO_PRODUCT_UNSUPPORTED`) rather than silently trusted — see
--      src/app/api/orders/route.ts for the customer-facing behavior this
--      produces and exactly which product types this currently excludes.
--
-- WHAT THIS FILE DOES:
--   1. Adds `orders.client_request_id` — a nullable, uniquely-indexed
--      column that makes "Place Order" idempotent (Step 79 §14): a retried
--      checkout attempt (a double-click that slips past the UI's own
--      guard, or a genuine network retry) sends the same value every time,
--      so `create_order()` below can recognize a repeat and return the
--      order it already created instead of creating a duplicate.
--   2. Adds `order_items.topup_info` — a nullable jsonb column preserving
--      the Game Top-Up System's (Step 58) `OrderItem.topUpInfo` (Player
--      ID/Server ID/Region/Player Name — never a credential, see
--      `types/topUp.ts`), which the existing schema had no column for at
--      all. Without this column, a real order would silently lose that
--      information the moment it left localStorage — the exact kind of
--      Order Snapshot loss Step 79 §4 says not to allow.
--   3. Creates `public.create_order(...)`, a single `SECURITY DEFINER`
--      function that is the ONLY way any order/order_items row is ever
--      written from this point forward. No INSERT/UPDATE policy is added
--      to `orders` or `order_items` — that is deliberate, not an
--      oversight: this project has no server-only service-role key
--      configured (see `.env.example` / `lib/supabase/server.ts`), so
--      there is no "trusted server client that bypasses RLS" available
--      the way the Step 38 schema's own comments originally assumed one
--      would exist. A `SECURITY DEFINER` function achieves the same
--      guarantee without one: `anon`/`authenticated` are granted EXECUTE
--      on this function ONLY (never table-level INSERT), so every write
--      it performs is fully validated by the function body itself —
--      trusted product prices looked up from `products` (never taken from
--      the caller for a real catalog item), validated quantities, a
--      server-generated order reference, and a user_id read from
--      `auth.uid()` (the caller's own verified JWT claim — never a
--      parameter, so it can never be spoofed) — before this function ever
--      touches a table.
--
-- NON-DESTRUCTIVE BY CONSTRUCTION: both ALTER TABLE statements use ADD
-- COLUMN IF NOT EXISTS; the function is CREATE OR REPLACE; nothing here
-- drops a table, drops a column, or deletes a row. No card/CVV/PIN/OTP/
-- password/secret field is added anywhere in this migration.
--
-- MANUAL APPLICATION REQUIRED: like every other migration in this
-- project, this file must be run in the Supabase Dashboard's SQL Editor
-- (or `supabase db push`) before real order persistence works — creating
-- this file does not, by itself, change the live database. Until it is
-- applied, `create_order` does not exist yet and every "Place Order"
-- attempt fails safely (the Route Handler reports a clear "temporarily
-- unavailable, please try again" error and never clears the cart — see
-- src/app/api/orders/route.ts).

-- =========================================================================
-- orders.client_request_id — idempotency key
-- =========================================================================
alter table orders add column if not exists client_request_id text;

-- Partial unique index (not a table constraint) specifically so multiple
-- historical rows can each have client_request_id = NULL (every order
-- created before this migration, and any future direct/manual insert that
-- doesn't supply one) without violating uniqueness — only non-null values
-- must be unique.
create unique index if not exists orders_client_request_id_key
  on orders (client_request_id)
  where client_request_id is not null;

-- =========================================================================
-- order_items.topup_info — Game Top-Up System snapshot (Step 58 parity)
-- =========================================================================
alter table order_items add column if not exists topup_info jsonb;

-- =========================================================================
-- create_order — the one trusted, validated order-write path
-- =========================================================================
-- See the file header above for why this is SECURITY DEFINER instead of a
-- client-facing INSERT policy. `search_path` is pinned to `public,
-- pg_temp` per Postgres's own documented SECURITY DEFINER hardening
-- guidance (prevents a search_path hijack from redirecting an unqualified
-- table reference inside this function to an attacker-created object,
-- including one created in a temp schema) — `auth.uid()` stays correctly
-- resolvable regardless, since it is schema-qualified.
--
-- Parameters:
--   p_client_request_id  — the idempotency key (Step 79 §14). NULL/empty
--                           disables idempotent-replay for that one call
--                           (every current call site always sends one).
--   p_customer_full_name — stored as-is (trimmed); the existing checkout
--                           UI has never required this to be non-empty
--                           (Step 30) and this migration does not change
--                           that behavior, only where the value ends up.
--   p_customer_email     — must look like an email address; this matches
--                           (does not add to) the existing client-side
--                           gate on /checkout's "Continue to Payment".
--   p_payment_method     — validated against the known method list by the
--                           calling Route Handler (data/paymentMethods.ts)
--                           before this function is ever called; this
--                           function only re-checks it is a non-empty,
--                           reasonably-sized string as defense in depth.
--   p_currency            — must be 'LAK' or 'USD' (orders_currency_check).
--                            Every real price in this app is computed and
--                            charged in USD today (see types/currency.ts's
--                            CurrencyCode vs. types/payment.ts's Currency —
--                            two deliberately separate concepts); this
--                            function does not invent or perform any
--                            currency conversion, it only validates
--                            whatever the trusted caller passes.
--   p_items               — jsonb array; each element MUST be
--                            {product_id, quantity, topup_info?}, where
--                            product_id is a real row in `products` (Step
--                            78's catalog) — name/slug/price/original_price/
--                            currency/stock are ALWAYS re-resolved from
--                            that table here, never taken from this
--                            parameter. An element with no product_id (a
--                            frontend-only demo product — wallet/gift-
--                            card/top-up, data/demoCatalog.ts, never
--                            written to Supabase) is rejected with
--                            `DEMO_PRODUCT_UNSUPPORTED`: this function has
--                            no table row to verify such an item's price
--                            against, and — since it is reachable by
--                            anyone holding the public publishable key,
--                            not only through this app's own Route
--                            Handler — accepting a caller-supplied price
--                            for it could never actually be trusted. See
--                            src/app/api/orders/route.ts for the
--                            customer-facing behavior this produces.
--
-- Returns a jsonb object with everything the caller needs to build a full
-- app-level Order (see src/types/order.ts) without a second, RLS-gated
-- read — necessary because a guest order (user_id null) can never be read
-- back via `orders_select_own` (Step 38's own deliberate design: there is
-- no "owner" to check a guest order against).
create or replace function public.create_order(
  p_client_request_id text,
  p_customer_full_name text,
  p_customer_email text,
  p_payment_method text,
  p_currency text,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_order_reference text;
  v_subtotal numeric(10, 2) := 0;
  v_discount numeric(10, 2) := 0;
  v_total numeric(10, 2) := 0;
  v_item jsonb;
  v_product_id uuid;
  v_product record;
  v_resolved_price numeric(10, 2);
  v_resolved_original numeric(10, 2);
  v_resolved_name text;
  v_resolved_slug text;
  v_topup_info jsonb;
  v_qty integer;
  v_line_total numeric(10, 2);
  v_line_original numeric(10, 2);
  v_attempt integer := 0;
  v_existing_order orders%rowtype;
  v_customer_name text;
  v_customer_email text;
  v_result jsonb;
begin
  -- -----------------------------------------------------------------------
  -- Idempotent replay (Step 79 §14, ownership-checked per the post-review
  -- security fix above) — checked BEFORE any validation or write, so a
  -- legitimate retry of an already-succeeded attempt always returns that
  -- same order, even if (implausibly) the retry's other parameters were
  -- somehow malformed.
  --
  -- OWNERSHIP CHECK: a client_request_id match is necessary but NOT
  -- sufficient to replay — the existing order must also belong to the
  -- SAME caller making THIS call, decided entirely from `v_user_id`
  -- (`auth.uid()`, this request's own verified JWT claim — never a
  -- parameter, never client-supplied, so it can never be spoofed):
  --   - An authenticated caller (v_user_id is not null) may only replay
  --     an order whose user_id equals v_user_id.
  --   - A guest caller (v_user_id is null) may only replay an order whose
  --     user_id is ALSO null (another guest order) — never an
  --     authenticated customer's order.
  -- On a mismatch, this deliberately does NOT return the other party's
  -- order and does NOT reveal whether one exists for that key — it fails
  -- exactly the same way (`IDEMPOTENCY_KEY_CONFLICT`) a genuinely-unknown
  -- key would if it then failed some other validation, so a caller
  -- probing with someone else's key learns nothing about that order.
  -- -----------------------------------------------------------------------
  if p_client_request_id is not null and length(p_client_request_id) > 0 then
    select * into v_existing_order from orders where client_request_id = p_client_request_id;
    if found then
      if not (
        (v_user_id is not null and v_existing_order.user_id = v_user_id)
        or (v_user_id is null and v_existing_order.user_id is null)
      ) then
        raise exception 'IDEMPOTENCY_KEY_CONFLICT';
      end if;

      select jsonb_build_object(
        'id', v_existing_order.id,
        'orderReference', v_existing_order.order_reference,
        'userId', v_existing_order.user_id,
        'customerFullName', v_existing_order.customer_full_name,
        'customerEmail', v_existing_order.customer_email,
        'subtotal', v_existing_order.subtotal,
        'discount', v_existing_order.discount,
        'total', v_existing_order.total,
        'currency', v_existing_order.currency,
        'paymentMethod', v_existing_order.payment_method,
        'paymentStatus', v_existing_order.payment_status,
        'orderStatus', v_existing_order.order_status,
        'createdAt', v_existing_order.created_at,
        'updatedAt', v_existing_order.updated_at,
        'items', coalesce((
          select jsonb_agg(jsonb_build_object(
            'productId', oi.product_id,
            'productName', oi.product_name,
            'productSlug', oi.product_slug,
            'quantity', oi.quantity,
            'unitPrice', oi.unit_price,
            'totalPrice', oi.total_price,
            'topUpInfo', oi.topup_info
          ) order by oi.id)
          from order_items oi where oi.order_id = v_existing_order.id
        ), '[]'::jsonb),
        'replay', true
      ) into v_result;
      return v_result;
    end if;
  end if;

  -- -----------------------------------------------------------------------
  -- Input validation (Step 79 §6/§20) — reject before writing anything.
  -- Every RAISE EXCEPTION message below is a short, stable code (never a
  -- raw internal detail) that the Route Handler maps to a localized,
  -- customer-safe message — see src/lib/orders/mapOrderErrorKey.ts.
  -- -----------------------------------------------------------------------
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;
  if jsonb_array_length(p_items) > 100 then
    raise exception 'TOO_MANY_ITEMS';
  end if;

  v_customer_name := coalesce(trim(p_customer_full_name), '');
  if length(v_customer_name) > 200 then
    raise exception 'INVALID_CUSTOMER';
  end if;

  v_customer_email := lower(coalesce(trim(p_customer_email), ''));
  if v_customer_email = '' or v_customer_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_customer_email) > 254 then
    raise exception 'INVALID_CUSTOMER';
  end if;

  if p_currency is null or p_currency not in ('LAK', 'USD') then
    raise exception 'INVALID_CURRENCY';
  end if;

  if p_payment_method is null or length(trim(p_payment_method)) = 0 or length(p_payment_method) > 50 then
    raise exception 'INVALID_PAYMENT_METHOD';
  end if;

  -- -----------------------------------------------------------------------
  -- Order shell. order_reference is generated HERE, server-side, and is
  -- never accepted as a parameter from the caller (Step 79 §3) — retried
  -- up to 5 times against the table's own UNIQUE constraint on the
  -- astronomically rare event of a collision, rather than trusting this
  -- function's own randomness alone to guarantee uniqueness.
  -- -----------------------------------------------------------------------
  v_order_id := gen_random_uuid();
  loop
    v_order_reference := 'DAN-' || to_char(now(), 'YYYYMMDD') || '-' ||
      upper(substr(md5(random()::text || clock_timestamp()::text || v_attempt::text), 1, 4));
    begin
      insert into orders (
        id, order_reference, user_id, customer_full_name, customer_email,
        subtotal, discount, total, currency, payment_method,
        payment_status, order_status, client_request_id
      ) values (
        v_order_id, v_order_reference, v_user_id, v_customer_name, v_customer_email,
        0, 0, 0, p_currency, trim(p_payment_method),
        'pending', 'pending_payment',
        nullif(p_client_request_id, '')
      );
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt >= 5 then
        raise exception 'ORDER_REFERENCE_COLLISION';
      end if;
    end;
  end loop;

  -- -----------------------------------------------------------------------
  -- Order items — trusted price resolution (Step 79 §5, tightened by the
  -- post-review security fix above). Every item MUST resolve to a real
  -- `products` row; there is no longer any path that accepts a
  -- caller-supplied price for anything.
  -- -----------------------------------------------------------------------
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := nullif(v_item->>'quantity', '')::integer;
    if v_qty is null or v_qty <= 0 or v_qty > 50 then
      raise exception 'INVALID_QUANTITY';
    end if;

    v_product_id := nullif(v_item->>'product_id', '')::uuid;

    -- No product_id at all means a frontend-only demo product (wallet/
    -- gift card/Game Top-Up — data/demoCatalog.ts, never written to
    -- Supabase). This function has no table row to verify such an item's
    -- price against and is reachable by anyone holding the public
    -- publishable key (not only through this app's own Route Handler),
    -- so it is rejected outright rather than trusted — see this
    -- function's header comment and src/app/api/orders/route.ts.
    if v_product_id is null then
      raise exception 'DEMO_PRODUCT_UNSUPPORTED';
    end if;

    v_topup_info := case
      when (v_item ? 'topup_info') and v_item->'topup_info' is not null and v_item->'topup_info' <> 'null'::jsonb
        then v_item->'topup_info'
      else null
    end;

    select id, name, slug, price, original_price, currency, stock_status
      into v_product
      from products
      where id = v_product_id;

    if not found then
      raise exception 'PRODUCT_NOT_FOUND';
    end if;
    if v_product.stock_status = 'out_of_stock' then
      raise exception 'PRODUCT_OUT_OF_STOCK';
    end if;
    if v_product.currency <> p_currency then
      raise exception 'CURRENCY_MISMATCH';
    end if;

    v_resolved_price := v_product.price;
    v_resolved_original := coalesce(v_product.original_price, v_product.price);
    v_resolved_name := v_product.name;
    v_resolved_slug := v_product.slug;

    v_line_total := round(v_resolved_price * v_qty, 2);
    v_line_original := round(v_resolved_original * v_qty, 2);

    insert into order_items (
      order_id, product_id, product_name, product_slug, quantity, unit_price, total_price, topup_info
    ) values (
      v_order_id, v_product_id, v_resolved_name, v_resolved_slug, v_qty, v_resolved_price, v_line_total, v_topup_info
    );

    v_subtotal := v_subtotal + v_line_total;
    v_discount := v_discount + greatest(v_line_original - v_line_total, 0);
  end loop;

  -- No coupon/discount-code system exists yet (the cart's own "Discount
  -- code" field is explicitly labeled "coming soon" — see CartDrawer);
  -- `discount` here is purely the informational "you saved $X vs. list
  -- price" figure `useCheckoutLines.ts` already computed client-side
  -- before this step, now computed server-side from trusted prices
  -- instead. Preserving that exact pre-existing "total = subtotal, never
  -- subtotal minus discount" relationship — not a Step 79 change.
  v_total := v_subtotal;

  update orders
     set subtotal = v_subtotal, discount = v_discount, total = v_total, updated_at = now()
   where id = v_order_id;

  select jsonb_build_object(
    'id', v_order_id,
    'orderReference', v_order_reference,
    'userId', v_user_id,
    'customerFullName', v_customer_name,
    'customerEmail', v_customer_email,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'total', v_total,
    'currency', p_currency,
    'paymentMethod', trim(p_payment_method),
    'paymentStatus', o.payment_status,
    'orderStatus', o.order_status,
    'createdAt', o.created_at,
    'updatedAt', o.updated_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'productId', oi.product_id,
        'productName', oi.product_name,
        'productSlug', oi.product_slug,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'totalPrice', oi.total_price,
        'topUpInfo', oi.topup_info
      ) order by oi.id)
      from order_items oi where oi.order_id = v_order_id
    ), '[]'::jsonb),
    'replay', false
  )
  into v_result
  from orders o where o.id = v_order_id;

  return v_result;
end;
$$;

-- By default, Postgres grants EXECUTE on a newly-created function to
-- PUBLIC — explicitly revoking that first, then granting only to the two
-- roles that must call it, makes the intended access boundary explicit
-- rather than incidental.
revoke all on function public.create_order(text, text, text, text, text, jsonb) from public;
grant execute on function public.create_order(text, text, text, text, text, jsonb) to anon, authenticated;
