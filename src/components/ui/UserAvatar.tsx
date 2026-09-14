import { getUserInitials } from "@/lib/users/avatar";
import { cn } from "@/lib/cn";
import type { User } from "@/types/user";

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl",
} as const;

/**
 * A signed-in user's avatar (Step 72 §5) — shows the real
 * `user.avatarUrl` image once a future step adds real upload/Supabase
 * Storage support; until then (every user today), falls back to the
 * deterministic default: the user's own initials on DANSHOP's signature
 * black, matching the site's monochrome visual system rather than
 * inventing a colorful avatar-generator look. `aria-hidden` — this always
 * sits next to the user's actual name/email as text, so the avatar itself
 * carries no information a screen reader user would be missing.
 */
export function UserAvatar({ user, size = "md", className }: { user: User; size?: keyof typeof sizeClasses; className?: string }) {
  if (user.avatarUrl) {
    return (
      // A future real avatar URL (Supabase Storage or an OAuth provider's
      // own photo), not a local asset Next's image optimizer would help with.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt=""
        aria-hidden="true"
        className={cn("shrink-0 rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-white",
        sizeClasses[size],
        className
      )}
    >
      {getUserInitials(user)}
    </span>
  );
}
