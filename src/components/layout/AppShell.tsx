"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

/**
 * LOGIN-UI-02/BRAND-UNIFY-01: `/login` and `/register` both get their own
 * dedicated `AuthTopBar` (inside `AuthShell`) instead of the normal site
 * header — real authentication "portal" pages, not the homepage with a
 * form on it. Gated on the exact routes only (every other page keeps the
 * normal header/sidebar completely unaffected), the same scoping pattern
 * `Footer.tsx`'s own `isAuthPage` branch already established for exactly
 * this kind of "these routes need to look different" need.
 */
const ROUTES_WITHOUT_GLOBAL_HEADER = new Set(["/login", "/register"]);

/**
 * Holds the one piece of state the header's toggle button and the sidebar
 * drawer both need to share. This has to live above both of them — they're
 * siblings, not parent/child — but the root layout itself must stay a
 * Server Component (it exports `metadata`), so that shared bit of client
 * state lives here instead, in a small dedicated client component.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const showGlobalHeader = !ROUTES_WITHOUT_GLOBAL_HEADER.has(pathname);

  return (
    <>
      {showGlobalHeader && (
        <>
          <Navbar isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
          <Sidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </>
      )}
      {/* tabIndex={-1}: makes this a valid target for the skip-to-content link —
          without it, activating the link scrolls here but keyboard focus has
          nowhere valid to land, so Tab would resume from the top of the page. */}
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
        {children}
      </main>
    </>
  );
}
