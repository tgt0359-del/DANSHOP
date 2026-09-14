import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * DANSHOP's logo slot, used in the header, the sidebar navigation drawer, and footer.
 *
 * No real logo asset exists yet, so this renders a styled text wordmark —
 * a subtle two-weight split ("DAN" solid, "SHOP" softer) to read as a
 * considered brand mark rather than a flat string, without introducing any
 * image/graphic. When a real logo file is ready, replace the two <span>s
 * below with the image, e.g.:
 *
 *   <Image src="/logo.svg" alt="DANSHOP" width={120} height={32} className="h-8 w-auto" />
 *
 * Recommended image height: 28–36px, to match this wordmark's footprint.
 * Every place that needs the logo already renders <Logo />, so that one
 * change is the only edit needed — Navbar, Sidebar, and Footer don't
 * need to change at all.
 */
export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="DANSHOP — go to homepage"
      className={cn(
        // UI-02.1 §5: a touch more size/weight for a more premium brand
        // presence — still the same plain text wordmark (no new logo
        // asset invented), just given more visual room to read as a
        // deliberate brand mark rather than a small inline label.
        "inline-flex h-9 shrink-0 items-center text-xl tracking-tight",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
        className
      )}
    >
      <span className="font-semibold text-foreground">DAN</span>
      <span className="font-medium text-secondary">SHOP</span>
    </Link>
  );
}
