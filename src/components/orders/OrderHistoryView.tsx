"use client";

import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { OrderCard } from "@/components/orders/OrderCard";
import { useLanguage } from "@/hooks/useLanguage";
import { useOrders } from "@/hooks/useOrders";

/**
 * Order History (Step 53) — every order this browser has placed, newest
 * first (see useOrders/orderRepository.getOrders). Explicit loading/error/
 * empty/populated states throughout (Step 53 §6); the guest note is shown
 * unconditionally rather than only in the empty state, since it's honest
 * context regardless of whether this browser happens to have orders yet
 * (Step 53 §8 — no faked login, no fabricated historical orders).
 */
export function OrderHistoryView() {
  const { t } = useLanguage();
  const { status, orders } = useOrders();

  return (
    <div className="py-10 sm:py-12 lg:py-16">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold leading-snug text-foreground sm:text-3xl">{t("orders.title")}</h1>
          <p className="mt-2 text-sm text-secondary">{t("orders.guestNote")}</p>

          <div className="mt-8">
            {status === "loading" && (
              <p role="status" className="py-12 text-center text-sm text-secondary">
                {t("orders.loading")}
              </p>
            )}

            {status === "error" && (
              <div role="alert" className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white py-16 text-center">
                <p className="text-base font-semibold text-foreground">{t("orders.errorTitle")}</p>
                <p className="max-w-sm text-sm text-secondary">{t("orders.errorDescription")}</p>
              </div>
            )}

            {status === "ready" && orders.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-white py-16 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-foreground">
                  <PackageOpen className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="text-base font-semibold text-foreground">{t("orders.emptyTitle")}</p>
                <p className="max-w-sm text-sm text-secondary">{t("orders.emptyDescription")}</p>
                <Link href="/games" prefetch={false} className={buttonClasses("primary", "md", "mt-2")}>
                  {t("cart.continueShopping")}
                </Link>
              </div>
            )}

            {status === "ready" && orders.length > 0 && (
              <ul className="flex flex-col gap-4">
                {orders.map((order) => (
                  <li key={order.id}>
                    <OrderCard order={order} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
