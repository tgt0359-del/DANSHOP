"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface PaymentMethodCardProps {
  name: string;
  description: string;
  icon: LucideIcon;
  selected: boolean;
  onSelect: () => void;
}

/**
 * One selectable payment method card — a native radio input wrapped in a
 * styled label, so keyboard/screen-reader users get real radio-group
 * behavior for free (Tab into the group, Arrow keys to move between
 * options, Space/click to select, correct "selected"/"N of 8" announcement)
 * instead of a custom-built approximation. The input itself is visually
 * hidden (`sr-only`); the label shows a visible focus ring via
 * `focus-within` so keyboard focus is never invisible.
 */
export function PaymentMethodCard({ name, description, icon: Icon, selected, onSelect }: PaymentMethodCardProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border-2 px-5 py-4 transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
        selected ? "border-primary bg-surface-elevated" : "border-border bg-surface hover:bg-surface-elevated"
      )}
    >
      <input
        type="radio"
        name="checkout-payment-method"
        value={name}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border sm:h-11 sm:w-11",
          selected ? "border-primary text-foreground" : "border-border text-secondary"
        )}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-foreground sm:text-base">{name}</span>
        <span className="text-xs text-secondary sm:text-sm">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-primary" : "border-border"
        )}
      >
        {selected && <span className="h-3 w-3 rounded-full bg-primary" />}
      </span>
    </label>
  );
}
