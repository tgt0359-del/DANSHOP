/**
 * The default DANSHOP avatar foundation (Step 72 §5) — a deterministic
 * concept, not a real image: the same user always produces the same
 * initials, computed purely from their own profile fields, no network
 * call, no Supabase Storage, no upload. `UserAvatar` (components/ui) is
 * what actually renders this; this file is just the pure derivation so it
 * can be tested/reused independently of any component.
 *
 * When a real avatar upload exists (a later step), `User.avatarUrl` being
 * non-null is already the only thing `UserAvatar` needs to check to show
 * the real image instead — nothing here needs to change.
 */

/** Up to two initials from a display name ("Jane Doe" → "JD"), falling
 * back to the first character of the email's local part if the display
 * name is empty or has no letters — `displayName` is `not null` in the
 * schema, but this stays defensive rather than assuming that's always
 * meaningful text. */
export function getUserInitials(user: { displayName: string; email: string }): string {
  const fromName = user.displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  if (fromName !== "") return fromName;

  const emailLocalPart = user.email.split("@")[0] ?? "";
  return emailLocalPart.slice(0, 1).toUpperCase() || "?";
}
