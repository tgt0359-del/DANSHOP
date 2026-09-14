"use client";

import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/components/ui/Button";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Shown for any URL that doesn't match a real route anywhere on the site
 * (a mistyped link, an old/removed bookmark, a not-yet-built page like a
 * footer link) — the general counterpart to games/[slug]/not-found.tsx's
 * product-specific version. Rendered inside the root layout like any other
 * page, so the header/sidebar/footer and full localization still apply —
 * unlike Next's own bare default 404, which this replaces site-wide.
 */
export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 sm:py-24">
      <Container>
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
          <h1 className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">
            {t("notFound.title")}
          </h1>
          <p className="text-sm leading-relaxed text-secondary sm:text-base">
            {t("notFound.description")}
          </p>
          <Link href="/" prefetch={false} className={buttonClasses("primary", "md", "mt-2")}>
            {t("gameDetail.backToHome")}
          </Link>
        </div>
      </Container>
    </div>
  );
}
