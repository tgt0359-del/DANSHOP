/**
 * An internal record id — this project's stand-in for what a real
 * database would assign as a primary key (e.g. a UUID or auto-increment
 * id). Shared across every domain's repository (orders, users, ...) that
 * needs one; domain-specific human-facing codes (like an order's
 * `orderReference`) are generated separately, right next to the domain
 * that owns them.
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (very old
  // browsers, or a non-secure context). Not cryptographically strong, but
  // this is a demo-only client-side id, not a real security boundary.
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
