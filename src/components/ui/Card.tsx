"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

/** Generic surface container — the base for game cards, panels, etc. in later phases. */
export function Card({
  children,
  className,
  hoverable = false,
}: {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -4 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "rounded-2xl border border-border bg-surface-elevated p-4 transition-[box-shadow,border-color] duration-200",
        hoverable && "hover:border-border-strong hover:shadow-lg hover:shadow-black/30",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
