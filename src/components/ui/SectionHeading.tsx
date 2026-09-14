import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Consistent title treatment for page sections, with an optional action (e.g. "View all"). */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
            {eyebrow}
          </p>
        )}
        <h2 id={id} className="mt-1 text-xl font-semibold leading-snug text-foreground sm:text-2xl">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-secondary">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
