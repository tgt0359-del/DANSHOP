import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant =
  | "solid"
  | "outline"
  | "subtle"
  | "discount"
  | "new"
  | "success"
  | "platform"
  | "region";

const variantClasses: Record<BadgeVariant, string> = {
  solid: "bg-primary text-white",
  outline: "border border-border-strong bg-background/60 text-foreground backdrop-blur-sm",
  subtle: "bg-surface text-secondary",
  discount: "bg-discount text-white",
  new: "bg-new-badge text-[#0b0d10]",
  success: "bg-success/15 text-success",
  platform: "bg-primary-soft text-primary",
  region: "border border-border bg-background/70 text-secondary backdrop-blur-sm",
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
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide leading-5",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
