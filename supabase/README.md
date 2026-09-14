# DANSHOP database architecture (Step 38)

This directory is **design and migration preparation only**. Nothing here
is connected to the running application yet, and no live Supabase project
is required to review it — see "Frontend compatibility" at the bottom.

## Files

- `migrations/20260906120000_initial_schema.sql` — tables, constraints, indexes.
- `migrations/20260906120100_row_level_security.sql` — RLS policies (see
  "RLS strategy" below for why these are migration-ready design rather
  than something meant to protect real traffic today).
- `seed.sql` — the existing 16 DANSHOP products from `src/data/games.ts`,
  transcribed exactly (same slugs, prices, discounts, ratings, categories).

## Table relationships

```
auth.users (Supabase-managed — credentials, sessions; not designed here)
    │ 1:1 (id)
    ▼
users ──────────────────────────────────────────┐
  │ 1:N                    │ 1:N                │ 1:N
  ▼                        ▼                     ▼
orders            wishlist_items        recently_viewed_items
  │ 1:N                        │ N:1                  │ N:1
  ▼                            ▼                       ▼
order_items ──N:1──▶ products ◀────────────────────────┘
  │                       │ N:1
  │                       ▼
  │                  categories
  │
  └── (order_id) ──1:N── payments

products
  │ 1:N
  ▼
product_images
```

Every arrow from `orders`/`order_items`/`payments`/`wishlist_items`/
`recently_viewed_items` down to `products` or `users` is nullable-on-delete
somewhere on purpose — see "Order history preservation" below.

## Primary keys

Every table uses a `uuid` primary key (`gen_random_uuid()`), matching the
application's own `generateId()` (`src/lib/generateId.ts`, which prefers
`crypto.randomUUID()`). `users.id` is the one exception: it's not
self-generated — it's a foreign key to (and shares its value with)
`auth.users.id`, which is what makes a profile row belong to exactly one
authenticated identity.

## Foreign keys and delete behavior

| Column | References | On delete | Why |
| --- | --- | --- | --- |
| `users.id` | `auth.users.id` | CASCADE | A profile with no backing auth identity is meaningless. |
| `products.category_id` | `categories.id` | RESTRICT | Prevents deleting a category while products still reference it — forces an explicit re-categorization first. |
| `product_images.product_id` | `products.id` | CASCADE | Images have no independent meaning once their product is gone. |
| `orders.user_id` | `users.id` | **SET NULL** | A deleted account must not delete that person's order history — the order just becomes indistinguishable from a guest order, which the schema already fully supports. |
| `order_items.order_id` | `orders.id` | CASCADE | A line item has no meaning without its order. |
| `order_items.product_id` | `products.id` | **SET NULL** | The most important delete-behavior decision in this schema — see below. |
| `payments.order_id` | `orders.id` | CASCADE | A payment record is scoped entirely to its order. |
| `wishlist_items.user_id` / `.product_id` | `users.id` / `products.id` | CASCADE | No historical value once either side is gone. |
| `recently_viewed_items.user_id` / `.product_id` | `users.id` / `products.id` | CASCADE | Same as wishlist. |

### Why `order_items.product_id` is `ON DELETE SET NULL`

This is deliberately **not** `CASCADE` and **not** `RESTRICT`:

- `CASCADE` would silently delete order history the moment a product is
  discontinued — completely unacceptable for financial/order records.
- `RESTRICT` would make it impossible to ever remove a discontinued
  product from the catalog, forever, as long as anyone had ever ordered it.
- `SET NULL` lets the product be removed while the `order_items` row
  survives untouched, because **the row doesn't actually depend on the
  live product for its meaning** — `product_name`, `product_slug`,
  `unit_price`, and `total_price` are all snapshotted at order time
  (matching `src/types/order.ts`'s `OrderItem`, which already snapshots
  these fields for exactly this reason). Losing the FK just means "this
  line item's product no longer exists in the catalog," which is
  information, not data loss.

## Unique constraints

- `categories.slug`
- `products.slug`
- `orders.order_reference`
- `payments.payment_reference`
- `users.email`
- `wishlist_items (user_id, product_id)` — no duplicate wishlist entries.
- `recently_viewed_items (user_id, product_id)` — re-viewing a product
  updates its existing row's `viewed_at` instead of inserting a duplicate,
  which is what makes "move to front, no duplicates" (the exact behavior
  `src/hooks/useRecentlyViewed.ts` already implements client-side) fall
  out naturally as an upsert.
- `product_images (product_id, sort_order)` — one image per position per product.

**Deliberately not unique:** `order_items (order_id, product_id)` — the
application's cart already prevents two lines for the same product in one
order (`CartProvider` merges quantities by slug), so a DB-level constraint
would only guard against an application bug, not a real user scenario, and
`product_id` is nullable — adding it was considered and left out to keep
the schema minimal per Step 38's "do not create unnecessary
constraints/tables" guidance.

## Indexes

Beyond the unique indexes created automatically by the unique constraints
above: `products.category_id`, `products.platform`, partial indexes on
`products.is_featured` / `is_new` / `is_on_sale` (each true for a small
minority of rows, so a partial index avoids indexing every `false` row),
`orders.user_id`, `orders.created_at`, `order_items.order_id`,
`payments.order_id`, `wishlist_items.user_id`,
`recently_viewed_items.user_id`, `recently_viewed_items.viewed_at`.

## RLS strategy

**Important:** this project has no real authentication provider yet (see
`src/lib/auth/README.md`) — every visitor today is an anonymous guest, and
`auth.uid()` would simply be null for any request. The policies in
`20260906120100_row_level_security.sql` are written as **migration-ready
design**: reviewed and intended to go live verbatim once real Supabase
Auth exists, per Step 38 §15's instruction not to ship an "allow
everything" placeholder policy in the meantime.

- **Public catalog reading** (`categories`, `products`, `product_images`):
  `SELECT` is open to everyone, including anonymous visitors — browsing
  never requires an account today and must not start requiring one.
- **Admin-only catalog management**: `INSERT`/`UPDATE`/`DELETE` on the
  same three tables require `users.role = 'admin'` for the requesting
  `auth.uid()`. This is the first real use of `UserRole` (Step 36 §2 — no
  permission logic existed anywhere before this).
- **User profile access**: a user can `SELECT`/`UPDATE` only their own
  `users` row. No public read (it contains an email address), and no
  client-side `INSERT` policy — a new row is expected to be created by a
  database trigger on `auth.users` insert (standard Supabase pattern), not
  a direct client write.
- **A user's own wishlist / recently viewed**: full `SELECT`/`INSERT`/
  `UPDATE`/`DELETE`, restricted to rows where `user_id = auth.uid()`. Safe
  to allow directly from the client — there's no guest-trust boundary to
  protect here and nothing is a financial or historical record.
- **A user's own orders** (and, through them, `order_items`/`payments`):
  `SELECT` only, restricted to `user_id = auth.uid()`. Guest orders
  (`user_id is null`) are **not** selectable through any client-side
  policy — there's no owner to check them against, which is correct: a
  guest has no session to read their order back through anyway (the
  current app already handles this by keeping the placed order in
  `localStorage`/context, not a database read).

## Guest checkout

`orders.user_id` is nullable specifically so the current, only checkout
path (`OrderReviewView` → `orderRepository.createOrder` with
`userId: null`, Step 34) keeps working once a real database exists. No
constraint anywhere requires a `user_id` on `orders`, `order_items`, or
`payments`.

**Order writes are intentionally outside the RLS policies above.** There
is no client-side `INSERT` policy for `orders`/`order_items`/`payments` at
all — creating an order (guest or signed-in) is expected to go through a
trusted server-side path (a Next.js Route Handler or Supabase Edge
Function using the service role key, which bypasses RLS). This is what
makes guest checkout possible under RLS in the first place: a guest has no
`auth.uid()` to satisfy an ownership check, so the write can never be
authorized by a row-level policy — it has to be authorized by the server
trusting its own logic instead.

## Order history preservation

Covered in detail under "Why `order_items.product_id` is `ON DELETE SET
NULL`" above, plus `orders.user_id`'s `SET NULL` behavior: deleting a
product or a user account can each, independently, never delete an order
or its line items. The snapshot fields already present in
`src/types/order.ts`'s `Order`/`OrderItem` (customer name/email, product
name/slug, unit/total price) are exactly what make this safe — the
historical record was always meant to be self-contained, not a live view
over current catalog/account data.

## Payment security boundaries

The `payments` table holds only: `id`, `order_id`, `provider`,
`payment_reference`, `payment_method`, `amount`, `currency`, `status`,
`created_at`, `updated_at` — matching `src/types/payment.ts`'s
`PaymentSession` and Step 33's payment-provider architecture. It contains
**no** card number, CVV, PIN, OTP, bank password, secret key, or raw
authentication credential column, and no column for a raw provider
response payload (Step 38 explicitly asks not to invent
provider-specific fields — a real BCEL/PayPal integration would define its
own verified fields once official documentation exists, not before).

`payments.status` uses the payment provider's own uppercase vocabulary
(`PENDING`/`PROCESSING`/`PAID`/`FAILED`/`CANCELLED`/`EXPIRED`, matching
`PaymentStatus` in `types/payment.ts`) — a deliberately different column
from `orders.payment_status` (DANSHOP's own lowercase vocabulary,
`OrderPaymentStatus`). `src/lib/payments/mapPaymentStatusToOrderPaymentStatus.ts`
is what would translate one into the other, and per Step 34 §4, that
translation must only ever run from a verified server-side confirmation
(a provider webhook or a server-to-server status check) — never a
client-side success screen. RLS reinforces this at the database layer:
there is no client-side write policy for `payments` at all.

## Frontend compatibility

**Nothing in the running application was changed by this step.** DANSHOP
continues to read from `src/data/games.ts` and write to `localStorage`
exactly as it did before — `src/types/product.ts`, `src/types/order.ts`,
`src/types/user.ts`, and `src/types/payment.ts` (Steps 33–36) are what this
schema was designed to match, but no code was pointed at Supabase. That
migration is explicitly future work (Step 38 §18).
