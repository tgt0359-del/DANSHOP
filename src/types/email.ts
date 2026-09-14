/**
 * Shared email-sending vocabulary (Phase 29 — Real Order Confirmation
 * Email Foundation) — the same "types live in src/types/, providers live
 * in lib/" layering `src/types/payment.ts`/`src/lib/payments/` already
 * established, mirrored here so email gets the identical adapter shape:
 * one small interface, one registry, one stub per candidate provider.
 */

/** The two candidate providers this phase prepares an adapter for, per
 * this phase's own instruction ("adapter/interface ที่พร้อมต่อกับ Resend
 * หรือ SMTP ภายหลัง") — no others are guessed at. */
export type EmailProviderId = "resend" | "smtp";

/** A single outgoing message — everything an adapter needs and nothing
 * more. Never carries a card number, CVV, PIN, OTP, or secret: those
 * fields don't exist anywhere in this app's `Order`/email payload types to
 * begin with (see `lib/email/emailTemplates.ts`). */
export interface EmailMessage {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Result of one send attempt. `queued` covers a provider that accepts a
 * message for async/background delivery and returns before delivery is
 * confirmed (e.g. an SMTP relay, or a provider whose API responds before
 * its own delivery webhook fires) — distinct from `sent`, which a provider
 * may reserve for a confirmed, synchronous acceptance. PHASE 34 implements
 * `providers/resendProvider.ts` for real (`sent` is reachable once
 * `RESEND_API_KEY`/`EMAIL_FROM` are genuinely set); `smtpProvider.ts`
 * remains an unimplemented stub, so `queued` stays unreachable until that
 * one is genuinely built too — this project's own `.env.local` sets
 * neither today, so every real send in this environment still resolves
 * `not_configured`.
 */
export type EmailSendResult =
  | { status: "not_configured" }
  | { status: "queued"; messageId?: string }
  | { status: "sent"; messageId: string }
  | { status: "failed"; reason: string };

/**
 * One provider adapter. `send` resolves (never throws for an ANTICIPATED
 * outcome like "not implemented yet" — see the stub providers) so
 * `emailService.ts` can treat every outcome as a plain value; an adapter
 * MAY still throw for a genuinely unexpected failure (e.g. a network
 * error), which `emailService.ts`'s own try/catch also handles.
 *
 * PHASE 34 (Real Order Email Notification Foundation): `isConfigured()` is
 * each provider's own answer to "do I have everything I need (credentials,
 * etc.) to attempt a real send right now?" — checked against that
 * provider's own environment variables (e.g. `RESEND_API_KEY` for Resend),
 * never a generic/shared check. This is what keeps `emailService.ts`
 * genuinely provider-neutral: it never needs to know a specific provider's
 * env var names, just "is the configured one ready or not" — adding a
 * third provider later means adding one more file that implements this
 * interface, not editing the service layer's own logic.
 */
export interface EmailProvider {
  id: EmailProviderId;
  isConfigured(): boolean;
  send(message: EmailMessage): Promise<EmailSendResult>;
}
