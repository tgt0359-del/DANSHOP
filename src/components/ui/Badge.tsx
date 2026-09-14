import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "solid" | "outline" | "subtle";

const variantClasses: Record<BadgeVariant, string> = {
  solid: "bg-black text-white",
  outline: "border border-border text-foreground",
  subtle: "bg-surface text-secondary",
};

/** Small pill label — used for things like discount tags, platform tags, or status. */
export function Badge({
  children,
  variant = "solid",
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
