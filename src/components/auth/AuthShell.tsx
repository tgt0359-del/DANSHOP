import type { ReactNode } from "react";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { AuthFormPanel } from "@/components/auth/AuthFormPanel";
import { AuthTopBar } from "@/components/auth/AuthTopBar";

/**
 * BRAND-UNIFY-01 — `/login` and `/register`'s shared dedicated page shell:
 * `<AuthTopBar />` + a two-column row (`AuthBrandPanel` + `AuthFormPanel`).
 * `min-h-screen` (not a `calc(100vh-headerHeight)`) — `AppShell` skips the
 * normal global header entirely on both routes, so `AuthTopBar` is the
 * only "header" on this page and lives right here as a sibling; the whole
 * shell can just fill the real viewport directly with no subtraction
 * needed.
 *
 * `lg:grid-cols-[56%_44%]` — this pass's own explicit "left ~52–58%,
 * right ~42–48%" split, replacing the earlier flat 50/50 `grid-cols-2`
 * now that both auth pages share this shell and the brief asks for an
 * asymmetric split favoring the branding side.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#080B10]">
      <AuthTopBar />
      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[56%_44%]">
        <AuthBrandPanel />
        <AuthFormPanel>{children}</AuthFormPanel>
      </div>
    </div>
  );
}
