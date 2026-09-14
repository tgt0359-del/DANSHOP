import type { User } from "@/types/user";

const USERS_KEY = "danshop_users";

function readUsers(): User[] {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as User[]) : [];
  } catch {
    // Malformed JSON or localStorage unavailable (e.g. privacy mode) — treat as empty.
    return [];
  }
}

function writeUsers(users: User[]) {
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore write failures — matches orderStore/CartProvider's own resilience.
  }
}

/**
 * Client-side user-profile persistence — this project's demo stand-in for
 * a real users table (Step 36 §5). This is not an authentication system:
 * no password or session lives here (see types/auth.ts) — just the
 * profile fields a signed-in user would have. Nothing in the live site
 * creates a user today (there's no real sign-up flow — see
 * lib/auth/guestAuthProvider.ts), so this store starts, and stays, empty
 * in normal use; it exists so lib/users/userRepository.ts's functions are
 * real and callable, not just type signatures.
 */
export function saveUser(user: User): void {
  const users = readUsers();
  users.push(user);
  writeUsers(users);
}

export function getUserById(id: string): User | undefined {
  return readUsers().find((user) => user.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  const normalized = email.trim().toLowerCase();
  return readUsers().find((user) => user.email.toLowerCase() === normalized);
}

/** Merges `patch` into the user matching `id` and bumps `updatedAt`.
 * Returns the updated user, or undefined if no user with that id exists. */
export function updateUser(id: string, patch: Partial<User>): User | undefined {
  const users = readUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return undefined;

  const updated: User = { ...users[index], ...patch, updatedAt: new Date().toISOString() };
  users[index] = updated;
  writeUsers(users);
  return updated;
}

export function deleteUser(id: string): boolean {
  const users = readUsers();
  const next = users.filter((user) => user.id !== id);
  if (next.length === users.length) return false;
  writeUsers(next);
  return true;
}
