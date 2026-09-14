import type { EmailMessage, EmailProvider, EmailSendResult } from "@/types/email";

/**
 * Resend (resend.com) integration — PHASE 34 (Real Order Email
 * Notification Foundation). A single `fetch` call to Resend's own HTTP
 * API (`POST /emails`) — no `resend` SDK package added as a dependency;
 * Resend's API surface is one plain JSON POST, so a raw `fetch` (already
 * available in this app's server runtime) covers it without a new
 * `package.json` entry. Server-only: `RESEND_API_KEY` is read only in this
 * file, never exported, never sent to the browser (this module is only
 * ever imported from `emailService.ts`, itself server-only — see that
 * file's own "never import from a 'use client' component" rule).
 *
 * Never fabricates a "sent" result: a real send only ever resolves `sent`
 * when Resend's own API responds 2xx with a real message id; every other
 * outcome (no key configured, a non-2xx response, a malformed response, a
 * network error) resolves `failed`/`not_configured` — this function never
 * throws, matching every other provider/service boundary in this app.
 * Never logs the API key, the full request/response body, or any message
 * content — only short, non-sensitive reason codes bubble up, and the
 * caller (`emailService.ts`) is what actually logs anything, already
 * scrubbed to an order reference + masked email + this reason code.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

interface ResendSuccessResponse {
  id?: string;
}

export const resendProvider: EmailProvider = {
  id: "resend",

  /** Whether a real `RESEND_API_KEY` is present — the one credential this
   * provider needs. `EMAIL_FROM` is a shared, provider-agnostic setting
   * checked once in `emailService.ts#isEmailServiceConfigured`, not
   * duplicated here. */
  isConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY?.trim());
  },

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    // Defensive — `emailService.ts` already checks `isConfigured()` before
    // ever calling `send()`, so this branch shouldn't be reachable in
    // practice, but `send()` must never assume a caller checked first.
    if (!apiKey) {
      return { status: "not_configured" };
    }

    try {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: message.from,
          to: [message.to],
          ...(message.replyTo ? { reply_to: message.replyTo } : {}),
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });

      if (!response.ok) {
        // A short, safe reason code only — never the response body, which
        // could echo back request content (e.g. Resend's validation errors
        // sometimes quote the offending field value).
        return { status: "failed", reason: `RESEND_HTTP_${response.status}` };
      }

      const data = (await response.json().catch(() => null)) as ResendSuccessResponse | null;
      if (!data?.id) {
        return { status: "failed", reason: "RESEND_INVALID_RESPONSE" };
      }
      return { status: "sent", messageId: data.id };
    } catch {
      // Network failure talking to Resend (DNS, timeout, connection reset,
      // ...) — never throw out of a provider's send(), matching
      // emailService.ts's own try/catch reasoning.
      return { status: "failed", reason: "RESEND_NETWORK_ERROR" };
    }
  },
};
