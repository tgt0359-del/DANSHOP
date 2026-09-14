"use client";

import { LifeBuoy, ShieldCheck, Zap } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/cn";

/**
 * A compact "why buy here" strip near the purchase panel (Step 67 §11) —
 * Secure Checkout / Instant Delivery / Support. Shared across all three
 * product-detail templates (`GameDetailInfo`/`WalletProductView`/
 * `TopUpFlowView`) rather than three copies, matching this codebase's own
 * established pattern (`ProductInfoSection`, `DenominationSelector`).
 *
 * Every label is an EXISTING, already-shown-elsewhere translation key, not
 * new copy invented for this step — `cart.secureCheckout` is the exact
 * label the Cart Drawer's own trust strip already uses (Step 65),
 * `home.trust.instantDeliveryTitle` is the homepage's own "why shop with
 * DANSHOP" section, and `footer.supportHeading` is the footer's existing
 * "Support" column heading. Reusing them here means this strip can never
 * say anything about delivery/checkout/support that the rest of the site
 * doesn't already say — satisfying §11's "only use claims already
 * consistent with the current DANSHOP product flow" by construction, not
 * by writing new careful copy.
 */
export function PurchaseTrustBadges({ className }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-surface px-4 py-3 text-xs font-medium text-secondary",
        className
      )}
    >
      <span className="flex items-center gap-1.5">
        <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t("cart.secureCheckout")}
      </span>
      <span className="flex items-center gap-1.5">
        <Zap className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t("home.trust.instantDeliveryTitle")}
      </span>
      <span className="flex items-center gap-1.5">
        <LifeBuoy className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t("footer.supportHeading")}
      </span>
    </div>
  );
}
