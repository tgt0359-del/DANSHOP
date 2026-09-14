import { NextResponse } from "next/server";
import { buildOrderConfirmationEmail, mapOrderToEmailPayload } from "@/lib/email/emailTemplates";
import { locales, type Locale } from "@/lib/i18n/config";
import type { Order, OrderPaymentStatus, OrderStatus } from "@/types/order";

/**
 * Development-only email template preview (Phase UI-27 §7) — renders the
 * REAL `buildOrderConfirmationEmail()` output (the exact function
 * `emailService.ts` calls for a real order) against synthetic, clearly
 * fake data, so the HTML/localization/status variants can be checked
 * visually without ever sending a real email or touching a real customer's
 * order (Phase §7 — "ห้ามใช้ข้อมูลลูกค้าจริงในการทดสอบ"). Never calls
 * `sendOrderConfirmationEmail` itself — this only exercises the template-
 * building half, which is all "checking the template" requires.
 *
 * Protected by being entirely absent outside development (Phase §7 —
 * "ห้ามเปิด endpoint ส่งอีเมลให้บุคคลทั่วไปเรียกได้โดยไม่มีการป้องกัน"):
 * this project has no admin/role system to gate behind (only guest vs.
 * signed-in — see `lib/auth/`), so rather than inventing one, this route
 * simply 404s whenever `NODE_ENV === "production"`, the same way a route
 * that doesn't exist would respond — indistinguishable from "not found" to
 * anyone probing a real deployment.
 *
 * Query params (all optional):
 *   locale — "en" | "lo" | "th" (default "en")
 *   status — "pending" | "paid" | "cancelled" (default "pending") — picks
 *            which of the confirmation email's status-specific headlines
 *            (Phase §2) to preview.
 *   format — "html" (default) | "text" — the plain-text fallback body.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const localeParam = url.searchParams.get("locale");
  const locale: Locale = localeParam && (locales as readonly string[]).includes(localeParam) ? (localeParam as Locale) : "en";
  const statusParam = url.searchParams.get("status");
  const format = url.searchParams.get("format") === "text" ? "text" : "html";

  const statusPresets: Record<string, { orderStatus: OrderStatus; paymentStatus: OrderPaymentStatus }> = {
    pending: { orderStatus: "pending_payment", paymentStatus: "pending" },
    paid: { orderStatus: "paid", paymentStatus: "paid" },
    cancelled: { orderStatus: "cancelled", paymentStatus: "cancelled" },
  };
  const preset = statusPresets[statusParam ?? "pending"] ?? statusPresets.pending;

  // Entirely synthetic — never a real order, never a real customer. Mirrors
  // the same fake-record convention this project already uses elsewhere
  // for "demo, never real" content (e.g. data/demoProducts.ts).
  const fakeOrder: Order = {
    id: "preview-id",
    orderReference: "DAN-PREVIEW-0000",
    userId: null,
    customer: { fullName: "Preview Customer", email: "preview@example.com" },
    items: [
      {
        productId: "preview-1",
        productName: "Preview Game One",
        productSlug: "preview-game-one",
        quantity: 1,
        unitPrice: 39.99,
        totalPrice: 39.99,
      },
      {
        productId: "preview-2",
        productName: "Preview Game Two",
        productSlug: "preview-game-two",
        quantity: 2,
        unitPrice: 29.99,
        totalPrice: 59.98,
      },
    ],
    subtotal: 99.97,
    discount: 10,
    total: 89.97,
    currency: "USD",
    paymentMethod: "PayPal",
    paymentStatus: preset.paymentStatus,
    orderStatus: preset.orderStatus,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
  };

  const payload = mapOrderToEmailPayload(fakeOrder, {
    orderUrl: "http://localhost:3000/orders/DAN-PREVIEW-0000",
    invoiceUrl: "http://localhost:3000/orders/DAN-PREVIEW-0000",
    locale,
  });
  const built = buildOrderConfirmationEmail(payload);

  if (format === "text") {
    return new NextResponse(built.text, { headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  return new NextResponse(built.html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
