import type { PaymentSession } from "@/types/payment";

const SESSIONS_KEY = "danshop_payment_sessions";
/** Keep storage bounded — same reasoning as orderStore's cap. */
const MAX_STORED_SESSIONS = 20;

function readSessions(): PaymentSession[] {
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PaymentSession[]) : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions: PaymentSession[]) {
  try {
    window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // Ignore write failures, matching orderStore's own resilience.
  }
}

/**
 * Client-side payment-session bookkeeping — a placeholder for what a real
 * backend would track server-side once a provider is wired up. A payment
 * session must ultimately live server-side, since only the server can
 * trust a provider's confirmation (see Step 33 §4 and
 * mapPaymentStatusToOrderPaymentStatus.ts) — this module exists only so the
 * PaymentSession shape has somewhere real to be read/written while no real
 * provider (and therefore no real server-side session store) exists yet.
 * Nothing in the live checkout flow calls this today — see
 * lib/payments/README.md for the intended future wiring.
 */
export function savePaymentSession(session: PaymentSession): void {
  const sessions = readSessions();
  sessions.push(session);
  const trimmed = sessions.length > MAX_STORED_SESSIONS ? sessions.slice(sessions.length - MAX_STORED_SESSIONS) : sessions;
  writeSessions(trimmed);
}

export function getPaymentSessionById(id: string): PaymentSession | undefined {
  return readSessions().find((session) => session.id === id);
}
