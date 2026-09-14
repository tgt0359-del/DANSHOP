import type { ReactNode } from "react";
import { GameArtwork } from "@/components/ui/GameArtwork";

/**
 * A stable, deterministic pseudo-"game" identity purely so the existing
 * procedural artwork generator (`GameArtwork`, Step 44/51) produces a
 * fixed, on-brand abstract background for the auth pages (Step 72 §2's
 * "optional subtle gaming visual/abstract background") — reusing the
 * exact same system every product-detail/hero image already uses rather
 * than inventing a new visual language or a real image. Because the
 * id/genre never change, the background is the same every time this page
 * loads, matching this app's own "deterministic" pattern for generated art.
 */
const AUTH_ARTWORK_SUBJECT = { id: "danshop-auth", genre: "Adventure", title: "DANSHOP" };

/**
 * The shared premium shell `/login` and `/register` both render into
 * (Step 72 §2) — one implementation, not two. Desktop (`lg` and up):
 * a two-column split with a dark abstract panel on the left and the form
 * on the right, matching a modern premium-marketplace login convention.
 * Below `lg`, the decorative panel disappears entirely rather than
 * shrinking — §7's own "mobile should feel like a proper mobile login
 * page, not a scaled-down desktop page" — leaving a clean, single-column,
 * mobile-native form.
 *
 * The site's normal header/sidebar-toggle/footer (`AppShell`) are left in
 * place, unchanged, the same way every other page (including the already
 * "focused-flow" checkout pages) already renders inside them — the
 * premium, full-page feel comes from this component's own content, not
 * from hiding the site chrome, which would also risk the account
 * dropdown's "remains functional" requirement (§4) since it lives in the
 * header.
 */
export function AuthPageLayout({ eyebrow, tagline, children }: { eyebrow: string; tagline: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col lg:grid lg:grid-cols-2 lg:min-h-[640px]">
      <div className="relative hidden overflow-hidden lg:block" aria-hidden="true">
        <GameArtwork game={AUTH_ARTWORK_SUBJECT} overlay="bottom" className="absolute inset-0 h-full w-full" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <p className="text-sm font-medium uppercase tracking-wider text-white/70">{eyebrow}</p>
          <p className="mt-3 max-w-sm text-2xl font-semibold leading-snug">{tagline}</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
