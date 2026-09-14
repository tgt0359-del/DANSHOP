/**
 * Combine class names, skipping any falsy values.
 *
 * Small local replacement for libraries like `clsx` — lets components write
 * conditional Tailwind classes such as `cn("base", active && "active")`.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
