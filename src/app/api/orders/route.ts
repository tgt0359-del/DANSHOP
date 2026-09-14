import { NextResponse } from "next/server";
import { findDemoProductBySlug } from "@/data/demoCatalog";
import { paymentMethods } from "@/data/paymentMethods";
import { getVariantsForProduct } from "@/data/productVariants";
import { sendOrderConfirmationEmail } from "@/lib/email/emailService";
import { locales } from "@/lib/i18n/config";
import { getProductBySlug } from "@/lib/products/productRepository";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/types/order";
import type { TopUpInfo } from "@/types/topUp";

/**
 * Real order creation (Step 79, price-trust tightened by a post-review
 * security fix) — the ONLY place in this app that is allowed to create an
 * `orders`/`order_items` row. `OrderReviewView` (via
 * `lib/orders/orderRepository.ts`'s `placeOrder`) sends the raw cart —
 * `{slug, quantity, variantId?, topUpInfo?}` pairs, exactly what
 * `CartProvider` already stores — never a client-computed price.
 *
 * Every line MUST resolve to a real Supabase catalog product (Step 78's
 * `products` table, via the existing `getProductBySlug()` —
 * ProductRepository/ProductService, never a raw Supabase query here, same
 * rule Step 78 §7 already established for UI code, extended to this
 * server code too): only its real `id` (a Supabase uuid) is forwarded to
 * `create_order()` — name/price/currency/stock are re-resolved AGAIN
 * inside that database function directly from `products`, so even a
 * request crafted by hand (bypassing this route entirely and calling the
 * RPC directly) cannot override a real product's price.
 *
 * A frontend-only demo product (wallet/gift-card/Game Top-Up —
 * `data/demoCatalog.ts`/`data/productVariants.ts`, never written to
 * Supabase) is deliberately REJECTED here with `DEMO_PRODUCT_UNSUPPORTED`
 * rather than resolved with a server-recomputed price: an earlier version
 * of this route did recompute such a price server-side and forward it to
 * `create_order()`, but that RPC is invocable by anyone holding the
 * public publishable key — not only through this route — so a
 * hand-crafted call could still have submitted an arbitrary price for
 * those items, and `create_order()` had no `products` row to check it
 * against. `findDemoProductBySlug`/`getVariantsForProduct` are still used
 * below, but ONLY to tell an honest "this item type isn't supported yet"
 * error apart from a genuinely unknown/invalid slug — never to build a
 * price. Until wallets/gift cards/Game Top-Up products have real rows in
 * `products`, they cannot be ordered through this trusted path; the cart,
 * their product pages, and "Add to Cart" are completely unaffected — only
 * the final "Place Order" step for a cart containing one of these fails
 * safely instead of persisting an unverifiable price.
 *
 * Never trusts a client-supplied userId (Step 79 §11): the signed-in
 * user's id comes back from `create_order()`'s own `auth.uid()` read
 * inside the database, resolved from the request's verified session
 * cookie by `getSupabaseServerClient()` — this route never reads or
 * forwards a userId from the request body at all.
 */

const MAX_ITEMS = 100;
const MAX_QUANTITY = 50;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOP_UP_INFO_KEYS = ["playerId", "serverId", "region", "playerName"] as const;

interface OrderItemRequestBody {
  slug?: unknown;
  quantity?: unknown;
  variantId?: unknown;
  topUpInfo?: unknown;
}

interface CreateOrderRequestBody {
  clientRequestId?: unknown;
  customer?: { fullName?: unknown; email?: unknown };
  paymentMethod?: unknown;
  items?: unknown;
  /** The checkout visit's current UI language (Order Email Notification
   * Foundation phase) — used ONLY to pick which already-translated copy
   * the order-confirmation email is written in (see
   * lib/email/emailService.ts). Never forwarded to `create_order()`,
   * never persisted: `orders` has no locale column, and this phase adds
   * none (a schema change this feature doesn't need). Validated below
   * against the three real locales; anything else is ignored in favor of
   * the default. */
  locale?: unknown;
}

/** Only the four known-safe display fields ever pass through — never an
 * arbitrary object the client might send (Step 58's own "never a real
 * account credential" rule, enforced again at this trust boundary). */
function sanitizeTopUpInfo(value: unknown): TopUpInfo | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Record<string, unknown>;
  const result: TopUpInfo = {};
  let hasAny = false;
  for (const key of TOP_UP_INFO_KEYS) {
    const raw = record[key];
    if (typeof raw === "string" && raw.trim() !== "") {
      result[key] = raw.slice(0, 200);
      hasAny = true;
    }
  }
  return hasAny ? result : undefined;
}

function errorResponse(code: string, status: number) {
  return NextResponse.json({ code, error: `Order could not be placed (${code}).` }, { status });
}

/** Resolved, trusted line data ready to send to `create_order()` — every
 * line must be a real Supabase catalog product; no price/name/slug field
 * is ever included here at all — the database re-resolves all of them
 * from `product_id` (Step 79 security fix — see this file's own header
 * comment for why a caller-supplied price is never accepted, even for a
 * demo-only item). */
interface ResolvedOrderLine {
  product_id: string;
  quantity: number;
  topup_info: TopUpInfo | null;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return errorResponse("UNAVAILABLE", 503);
  }

  let body: CreateOrderRequestBody;
  try {
    body = (await request.json()) as CreateOrderRequestBody;
  } catch {
    return errorResponse("INVALID_REQUEST", 400);
  }

  const clientRequestId = typeof body.clientRequestId === "string" ? body.clientRequestId.slice(0, 100) : "";
  const fullName = typeof body.customer?.fullName === "string" ? body.customer.fullName.slice(0, 200) : "";
  const email = typeof body.customer?.email === "string" ? body.customer.email.trim().toLowerCase() : "";
  const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod : "";
  const rawItems = Array.isArray(body.items) ? (body.items as OrderItemRequestBody[]) : [];
  const locale =
    typeof body.locale === "string" && (locales as readonly string[]).includes(body.locale) ? body.locale : undefined;

  if (!EMAIL_PATTERN.test(email)) {
    return errorResponse("INVALID_CUSTOMER", 400);
  }
  if (!paymentMethods.some((method) => method.name === paymentMethod)) {
    return errorResponse("INVALID_PAYMENT_METHOD", 400);
  }
  if (rawItems.length === 0 || rawItems.length > MAX_ITEMS) {
    return errorResponse("EMPTY_CART", 400);
  }

  // Quantity validation (Step 79 §6) — integer, > 0, within a sane cap.
  // Product validation/resolution (Step 79 §5/§20, tightened by the
  // post-review security fix) — every line must resolve to a REAL
  // Supabase catalog product; nothing else is ever forwarded to
  // create_order() at all, price included.
  const resolvedItems: ResolvedOrderLine[] = [];
  for (const raw of rawItems) {
    const slug = typeof raw.slug === "string" ? raw.slug : null;
    const quantity = typeof raw.quantity === "number" ? raw.quantity : NaN;
    const variantId = typeof raw.variantId === "string" ? raw.variantId : undefined;
    const topUpInfo = sanitizeTopUpInfo(raw.topUpInfo) ?? null;

    if (!slug || !Number.isInteger(quantity) || quantity <= 0 || quantity > MAX_QUANTITY) {
      return errorResponse("INVALID_QUANTITY", 400);
    }

    // The real Supabase-backed catalog is the only trusted source (Step
    // 78). Only `id` is forwarded; price/name/slug/stock are re-checked
    // inside create_order() itself, from `products`, never from anything
    // in this request.
    const product = await getProductBySlug(slug);
    if (product) {
      resolvedItems.push({ product_id: product.id, quantity, topup_info: topUpInfo });
      continue;
    }

    // Not a real catalog product. Check the frontend-only demo catalog
    // (wallet/gift-card/Game Top-Up) ONLY to give an accurate, honest
    // error — a known demo product gets DEMO_PRODUCT_UNSUPPORTED (it
    // exists, but can't be ordered through this trusted path yet, since
    // it has no `products` row for create_order() to verify a price
    // against — see this file's header comment); anything else gets
    // PRODUCT_NOT_FOUND (a bad/removed/unknown slug). Neither branch ever
    // forwards a price for this item.
    if (variantId) {
      const demoProduct = findDemoProductBySlug(slug);
      const variant = demoProduct ? getVariantsForProduct(demoProduct.id).find((candidate) => candidate.id === variantId) : undefined;
      if (demoProduct && variant) {
        return errorResponse("DEMO_PRODUCT_UNSUPPORTED", 409);
      }
    }

    return errorResponse("PRODUCT_NOT_FOUND", 400);
  }

  const client = await getSupabaseServerClient();
  const { data, error } = await client.rpc("create_order", {
    p_client_request_id: clientRequestId || null,
    p_customer_full_name: fullName,
    p_customer_email: email,
    p_payment_method: paymentMethod,
    // Every real price in this app is computed and charged in USD (see
    // types/currency.ts's CurrencyCode vs. types/payment.ts's Currency) —
    // matches the exact literal the pre-Step-79 client code always sent.
    // No currency conversion happens anywhere in this route.
    p_currency: "USD",
    p_items: resolvedItems,
  });

  if (error || !data) {
    // A missing function is reported two different ways depending on
    // which layer notices first: PostgREST's own schema-cache lookup
    // ("PGRST202" — the common case, since PostgREST checks before the
    // call ever reaches Postgres) or, less commonly, Postgres itself
    // ("42883" — undefined_function). Either way, this means the Step 79
    // migration hasn't been applied to the live database yet — reported
    // distinctly server-side (never to the client) so it's diagnosable
    // without exposing internals.
    const lowerMessage = (error?.message ?? "").toLowerCase();
    if (error?.code === "PGRST202" || error?.code === "42883" || lowerMessage.includes("could not find the function") || lowerMessage.includes("does not exist")) {
      console.warn("[api/orders] create_order() is not deployed yet — migration 20260909010000 not applied.");
      return errorResponse("UNAVAILABLE", 503);
    }

    const code = typeof error?.message === "string" && /^[A-Z_]+$/.test(error.message) ? error.message : "GENERIC";
    console.warn("[api/orders] order creation failed:", code);
    const status =
      code === "PRODUCT_NOT_FOUND" || code === "PRODUCT_OUT_OF_STOCK" || code === "DEMO_PRODUCT_UNSUPPORTED"
        ? 409
        : code === "GENERIC" || code === "ORDER_REFERENCE_COLLISION"
          ? 500
          : code === "IDEMPOTENCY_KEY_CONFLICT"
            ? 409
            : 400;
    return errorResponse(code, status);
  }

  const rpcResult = data as RpcOrderResult;
  const order = mapRpcResultToOrder(rpcResult);

  // Order Email Notification Foundation phase: fire the confirmation email
  // only for a genuinely new order, never a replayed one (see
  // RpcOrderResult.replay's own comment) — this is what makes a retried
  // "Place Order" click (same idempotency key, e.g. a network retry or a
  // double click) unable to send a duplicate email. Awaited so it actually
  // runs to completion in a serverless environment, but wrapped in its own
  // try/catch so nothing here can ever turn a successful order creation
  // into a failed response — sendOrderConfirmationEmail itself already
  // never throws, this is a second, independent safety net.
  //
  // Phase 29: `emailDeliveryStatus` is always attached to this response —
  // it's just a short, non-sensitive status word (e.g. "sent",
  // "not_configured"), never an email address or message body — so
  // `OrderSuccessView` can show the customer an honest, status-derived
  // sentence ("A confirmation email has been sent..." only when this is
  // genuinely "sent"/"queued") in every environment, not only development.
  let emailDeliveryStatus: string | undefined;
  if (!rpcResult.replay) {
    try {
      const emailResult = await sendOrderConfirmationEmail({ order, locale });
      emailDeliveryStatus = emailResult.status;
    } catch {
      console.warn("[api/orders] order confirmation email threw unexpectedly", {
        orderReference: order.orderReference,
      });
    }
  }

  return NextResponse.json({ order, ...(emailDeliveryStatus ? { emailDeliveryStatus } : {}) }, { status: 201 });
}

interface RpcOrderItemResult {
  productId: string | null;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
  topUpInfo: TopUpInfo | null;
}

interface RpcOrderResult {
  id: string;
  orderReference: string;
  userId: string | null;
  customerFullName: string;
  customerEmail: string;
  subtotal: number | string;
  discount: number | string;
  total: number | string;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  updatedAt: string;
  items: RpcOrderItemResult[];
  /** `true` when this call replayed an existing order via its idempotency
   * key (Step 79 §14) instead of creating a new one — see the migration's
   * own two `jsonb_build_object(...)` result branches. Order-confirmation
   * email only fires when this is `false`, so a retried "Place Order"
   * click (same clientRequestId) can never send a duplicate email. */
  replay: boolean;
}

/** Maps `create_order()`'s jsonb result into this app's existing `Order`
 * shape (types/order.ts) — so every existing consumer (OrderSuccessView,
 * OrderHistoryView, useLastOrder, ...) keeps working completely unchanged,
 * now displaying a record that is ALSO durably persisted in Supabase. */
function mapRpcResultToOrder(result: RpcOrderResult): Order {
  const items: OrderItem[] = (result.items ?? []).map((item) => ({
    // OrderItem.productId is non-nullable (pre-Step-79 shape); a demo-only
    // line has no real product id, so its slug is used as the stable
    // fallback — the same fallback pattern OrderSuccessView already
    // applies when a real game has since been delisted from the catalog.
    productId: item.productId ?? item.productSlug,
    productName: item.productName,
    productSlug: item.productSlug,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    totalPrice: Number(item.totalPrice),
    topUpInfo: item.topUpInfo ?? undefined,
  }));

  return {
    id: result.id,
    orderReference: result.orderReference,
    userId: result.userId,
    customer: { fullName: result.customerFullName, email: result.customerEmail },
    items,
    subtotal: Number(result.subtotal),
    discount: Number(result.discount),
    total: Number(result.total),
    currency: result.currency as Order["currency"],
    paymentMethod: result.paymentMethod,
    paymentStatus: result.paymentStatus as Order["paymentStatus"],
    orderStatus: result.orderStatus as Order["orderStatus"],
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}
