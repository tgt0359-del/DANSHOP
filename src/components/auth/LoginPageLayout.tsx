import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * UI-LOGIN-REDESIGN-01 §3 — a dedicated shell for `/login` only.
 *
 * Deliberately a NEW component rather than a rewrite of the existing
 * `AuthPageLayout.tsx` (Step 72), which `/register` still renders into
 * unchanged — this step's scope is the Login page and "components related
 * to it" only (§8: "ห้ามแก้ส่วนอื่น"), so Register's page keeps its
 * existing dark-panel look exactly as before rather than inheriting this
 * redesign as a side effect of editing a shared file.
 *
 * Replaces the old dark `GameArtwork`-backed left panel with a light,
 * mostly-white/soft-gray brand panel (§3: "ห้ามใช้พื้นหลังดำหนัก ๆ...
 * ห้ามใส่ภาพ placeholder แบบมืดหรือ abstract shapes ที่รบกวนสายตา") — just
 * the wordmark, the real `brand.tagline` copy, and two barely-visible
 * blurred circles for a touch of depth, in the same small blue "accent"
 * this pass introduces (§3: "ใช้ accent color เล็กน้อย เช่น น้ำเงินแบบ
 * Steam"). This accent is scoped to this file alone (a plain Tailwind
 * blue, not a new global token in `globals.css`) — the rest of the site's
 * deliberately-monochrome palette (see that file's own comment) is
 * untouched.
 *
 * `lg` and up: two columns (brand panel + form). Below `lg`, the panel
 * disappears entirely rather than shrinking, matching Step 72's original
 * "mobile should feel like a proper mobile login page" reasoning — the
 * `Logo` rendered inside the form card (by `LoginView`) already carries
 * the brand identity at that width, satisfying §3 Mobile's "ซ่อนหรือย่อ
 * Brand/Visual ด้านซ้ายให้เหมาะสม" without a second, redundant logo.
 *
 * The form itself is wrapped here in a real, visible "Login Card" (white,
 * thin border, soft shadow only — §5: "ใช้ shadow แบบบางและนุ่มเท่านั้น")
 * sitting on the page's normal light background, rather than the form
 * floating directly on the page as it did before.
 */
export function LoginPageLayout({ children }: { children: ReactNode }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-1 flex-col lg:grid lg:grid-cols-2 lg:min-h-[640px]">
      <div
        className="relative hidden overflow-hidden bg-gradient-to-br from-white to-[var(--surface)] lg:flex lg:flex-col lg:justify-center lg:px-12 xl:px-16"
        aria-hidden="true"
      >
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="relative max-w-sm">
          <Logo />
          <div className="mt-6 h-1 w-10 rounded-full bg-blue-600" />
          <p className="mt-6 text-2xl font-semibold leading-snug text-foreground">{t("brand.tagline")}</p>
          <p className="mt-3 text-sm text-secondary">{t("auth.signInIntro")}</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14 lg:py-10">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
