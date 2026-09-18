"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * The real DANSHOP "DS" logo artwork, supplied by the user and saved at
 * this permanent path. Intrinsic size below (1983×793, ratio ~2.5:1) is
 * the file's own real dimensions, read directly from its PNG header —
 * required by `next/image` for a non-`fill` image, and is what lets
 * `h-auto` below scale the rendered size while keeping the exact real
 * aspect ratio (never stretched/squeezed).
 */
const LOGO_SRC = "/images/danshop-logo.png";
const LOGO_WIDTH = 1983;
const LOGO_HEIGHT = 793;

/**
 * BRAND-UNIFY-01 — the left branding panel, shared by `/login` and
 * `/register`'s desktop split-screen layout (`lg` and up only; hidden
 * below `lg`, same breakpoint every prior auth-page pass already used).
 *
 * Background: a layered dark gradient, `#080B10` → `#0B0F16` — this
 * pass's own exact hexes, replacing the previous pass's very-similar-but-
 * not-identical `#0B0D10`/`#11151B`. Same restrained grid texture + two
 * low-opacity `#1A9FFF` glows as before — "very subtle grid/noise/
 * gradient decoration," nothing louder.
 *
 * Logo sizing: `max-w-[520px]` (within this pass's own explicit
 * "~420–560px" desktop target) — deliberately SMALLER than the previous
 * pass's `760px` cap. That earlier size was itself a direct, explicit
 * request from the message right before this one; this pass explicitly
 * asks for a more moderate size instead, so this isn't a regression, it's
 * this task's own stated target. `object-contain` (`h-auto w-full` + the
 * real intrinsic ratio) still guarantees no crop/stretch/squeeze at any
 * width. `alt="DANSHOP logo"` is this pass's own exact requested string
 * (previously `"DANSHOP.com"`).
 *
 * Layout: POLISH-01 switched this from a fixed `pt-20 xl:pt-24` offset to
 * `justify-center` — the fixed offset left this panel visually top-heavy
 * on tall viewports (the right column's own content height stretches
 * this grid row, e.g. ~957px on a 1440x900 screen, but the logo/tagline/
 * benefits block is only ~480px tall, so a fixed top offset left ~96px
 * above and ~380px of dead space below). Vertically centering the whole
 * group divides that leftover space evenly above and below instead,
 * which is what this pass's own "avoid excessive empty space above or
 * below" asks for. Content order is unchanged: logo → accent line →
 * tagline → supporting line → 3 benefit rows, all real, already-
 * translated copy (`brand.tagline`, `auth.signInIntro`, the three
 * `auth.benefit*` keys) — no new hardcoded text.
 */
export function AuthBrandPanel() {
  const { t } = useLanguage();

  const benefitKeys = ["auth.benefitDiscover", "auth.benefitFastSimple", "auth.benefitEveryPlayer"] as const;

  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-b from-[#080B10] to-[#0B0F16] lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-12 lg:py-12 xl:px-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="absolute -top-24 -left-16 h-[26rem] w-[26rem] rounded-full bg-[#1A9FFF]/[0.06] blur-[130px]" />
        <div className="absolute -bottom-32 right-0 h-[22rem] w-[22rem] rounded-full bg-[#1A9FFF]/[0.03] blur-[130px]" />
      </div>

      {/* The dominant element of the panel. No border/background of its
          own — "no thick frame, no solid card" — just the image and a
          soft glow beneath it. */}
      <div className="relative w-full max-w-[520px]">
        <Image
          src={LOGO_SRC}
          alt="DANSHOP logo"
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          priority
          sizes="(min-width: 1024px) 520px, 400px"
          className="h-auto w-full object-contain drop-shadow-[0_0_40px_rgba(26,159,255,0.18)]"
        />
      </div>

      <div className="relative mt-10 w-full max-w-sm">
        <div className="h-1 w-10 rounded-full bg-[#1A9FFF]" />
        <p className="mt-6 text-3xl font-semibold leading-snug text-white">{t("brand.tagline")}</p>
        <p className="mt-3 text-sm leading-relaxed text-[#A3AAB8]">{t("auth.signInIntro")}</p>

        <ul className="mt-8 flex flex-col gap-3">
          {benefitKeys.map((key) => (
            <li key={key} className="flex items-center gap-3 text-sm text-[#A3AAB8]">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1A9FFF]/10">
                <Check className="h-3.5 w-3.5 text-[#1A9FFF]" aria-hidden="true" />
              </span>
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
