"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * BRAND-UNIFY-01 — the right column, shared by `/login` and `/register`:
 * an explicit, same-tab "← Back to Home" link (real `next/link`, never
 * `target="_blank"`/`window.open`) above the card, then the actual form
 * card — `children` is exactly the content `LoginView`/`RegisterView`
 * supply.
 *
 * Card is `max-w-[500px]` (a touch wider than the prior `480px`, per this
 * pass's own "increase card width slightly if needed, but not too wide"),
 * `rounded-[20px]`, `#151922` background, `rgba(255,255,255,0.10)` border,
 * soft (never glowing) shadow — all this pass's own exact values. The
 * panel's own outer background is `#111827`, one step lighter than the
 * page/brand-panel `#080B10`/`#0B0F16` and one step darker than the card
 * itself — the third tier of the layered-depth system this pass's own
 * background hexes describe.
 */
export function AuthFormPanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#111827] px-4 py-10 sm:px-6 sm:py-14 lg:py-10">
      <div className="w-full max-w-[500px]">
        <div className="mb-4 flex justify-center lg:justify-start">
          <BackToHomeLink />
        </div>

        <div className="rounded-[20px] border border-white/10 bg-[#151922] p-[22px] shadow-[0_8px_28px_rgba(0,0,0,0.4)] sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

function BackToHomeLink() {
  const { t } = useLanguage();
  return (
    <Link
      href="/"
      prefetch={false}
      className="rounded text-sm font-medium text-[#A3AAB8] underline-offset-2 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A9FFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827]"
    >
      ← {t("marketplace.backToHome")}
    </Link>
  );
}
