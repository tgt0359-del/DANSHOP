"use client";

import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { useLanguage } from "@/hooks/useLanguage";

/** Shown when a /product/{slug} URL doesn't match a wallet/gift-card
 * product (or matches a demo product that has no denominations to sell) —
 * triggered by notFound() in page.tsx. Mirrors games/[slug]/not-found.tsx. */
export default function WalletProductNotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 sm:py-24">
      <Container>
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
          <h1 className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">
            {t("wallet.notFoundTitle")}
          </h1>
          <p className="text-sm leading-relaxed text-secondary sm:text-base">
            {t("wallet.notFoundDescription")}
          </p>
          <Link href="/" prefetch={false} className={buttonClasses("primary", "md", "mt-2")}>
            {t("gameDetail.backToHome")}
          </Link>
        </div>
      </Container>
    </div>
  );
}
