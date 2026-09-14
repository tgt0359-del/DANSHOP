import type { EmailProvider, EmailSendResult } from "@/types/email";

/**
 * Generic SMTP relay integration boundary.
 *
 * TODO(email/smtp): `send()` NOT IMPLEMENTED. No real SMTP host/credentials
 * exist in this project. Implement this only once real, server-only
 * `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD` (see `.env.example`)
 * are actually available — e.g. via `nodemailer` (not currently a
 * dependency; would need to be added deliberately, not assumed present),
 * sending `message.to`/`from`/`replyTo`/`subject`/`html`/`text` and
 * mapping the transport's real result to `EmailSendResult`
 * (`{status:"sent"|"queued", messageId}` on success, `{status:"failed",
 * reason}` on a real transport error — never a fabricated success). See
 * `resendProvider.ts` for what a genuinely-implemented sibling looks like.
 *
 * `isConfigured()` IS real (PHASE 34) — it honestly reports whether the
 * three SMTP credentials are present, even though `send()` itself is still
 * a stub; this keeps `emailService.ts#isEmailServiceConfigured` accurate
 * either way (an SMTP relay's host/user/password being present doesn't
 * matter yet, since `send()` can't use them, but the shape is ready).
 *
 * Until `send()` is implemented, this exists purely so
 * `providerRegistry.ts`/`EMAIL_PROVIDER` can reference an "smtp" provider
 * by id without a runtime hole — see `resendProvider.ts`'s identical
 * reasoning for why this resolves a plain `failed` result instead of
 * throwing.
 */
export const smtpProvider: EmailProvider = {
  id: "smtp",

  isConfigured(): boolean {
    return Boolean(
      process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASSWORD?.trim()
    );
  },

  async send(): Promise<EmailSendResult> {
    return { status: "failed", reason: "PROVIDER_NOT_IMPLEMENTED" };
  },
};
