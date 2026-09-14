import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Centers content and applies consistent horizontal page padding.
 * Wrap any section's content in this to keep widths aligned site-wide.
 */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
