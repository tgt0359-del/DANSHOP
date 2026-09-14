import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "inverse" | "inverseOutline";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-black text-white hover:bg-neutral-800",
  secondary: "bg-white text-foreground border border-border hover:bg-surface",
  ghost: "bg-transparent text-foreground hover:bg-surface",
  // For use on dark/photographic backgrounds, e.g. the homepage hero.
  inverse: "bg-white text-black hover:bg-neutral-200",
  inverseOutline: "bg-transparent text-white border border-white/70 hover:bg-white/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  // UI-31 (Cart and Checkout Visual Polish): an opt-in, larger primary-CTA
  // size — 56px tall, matching the Cart page's own already-bespoke h-14
  // Checkout button. Additive only: no existing call site uses "xl", so
  // every current "sm"/"md"/"lg" button everywhere else in the app (Hero,
  // Homepage, ProductCard, Catalog, ...) renders exactly as before.
  xl: "h-14 px-7 text-base",
};

/** Build the same visual style Button uses, for cases that need a plain `<Link>` instead (e.g. a button-styled CTA that navigates). */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
}

/** Base button for the whole site — primary (solid black), secondary (outlined), ghost, and inverse variants for dark backgrounds. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={buttonClasses(variant, size, className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
