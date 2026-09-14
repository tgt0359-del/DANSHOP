"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { useLanguage } from "@/hooks/useLanguage";

export type PaymentReturnKind = "success" | "cancel" | "failed";

const ICONS: Record<PaymentReturnKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  cancel: XCircle,
  failed: AlertTriangle,
};

/**
 * Placeholder return pages for /checkout/payment/{success,cancel,failed} —
 * part of Step 33's payment-gateway architecture preparation, not the live
 * checkout flow (the real, working order confirmation is still
 * /checkout/success — see OrderSuccessView). Nothing currently redirects
 * here: these routes exist so a real payment provider has somewhere to
 * send the customer back to once one is actually integrated. They
 * deliberately never claim a payment outcome — only a verified
 * server-side check may ever do that (see lib/payments/README.md).
 */
export function PaymentReturnPlaceholder({ kind }: { kind: PaymentReturnKind }) {
  const { t } = useLanguage();
  const Icon = ICONS[kind];

  return (
    <div className="py-16 sm:py-24">
      <Container>
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface text-foreground">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-semibold leading-snug text-foreground">{t(`paymentGateway.${kind}.title`)}</h1>
          <p className="text-sm text-secondary">{t(`paymentGateway.${kind}.message`)}</p>
          <p className="text-xs text-secondary">{t("paymentGateway.placeholderNotice")}</p>
          <Link href="/" prefetch={false} className={buttonClasses("primary", "md")}>
            {t("paymentGateway.backHome")}
          </Link>
        </div>
      </Container>
    </div>
  );
}
