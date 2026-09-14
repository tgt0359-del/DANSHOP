"use client";

import { useState, type ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

/**
 * Holds the one piece of state the header's toggle button and the sidebar
 * drawer both need to share. This has to live above both of them — they're
 * siblings, not parent/child — but the root layout itself must stay a
 * Server Component (it exports `metadata`), so that shared bit of client
 * state lives here instead, in a small dedicated client component.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <Navbar isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      <Sidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      {/* tabIndex={-1}: makes this a valid target for the skip-to-content link —
          without it, activating the link scrolls here but keyboard focus has
          nowhere valid to land, so Tab would resume from the top of the page. */}
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
        {children}
      </main>
    </>
  );
}
