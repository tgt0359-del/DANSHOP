import type { EmailProvider, EmailProviderId } from "@/types/email";
import { resendProvider } from "@/lib/email/providers/resendProvider";
import { smtpProvider } from "@/lib/email/providers/smtpProvider";

const registry: Record<EmailProviderId, EmailProvider> = {
  resend: resendProvider,
  smtp: smtpProvider,
};

function isEmailProviderId(value: string): value is EmailProviderId {
  return value in registry;
}

/**
 * Looks up an email provider implementation by id (from `EMAIL_PROVIDER`
 * — see `.env.example`) — the one place `emailService.ts` gets "the
 * configured provider" instead of importing a specific provider module
 * directly, mirroring `lib/payments/providerRegistry.ts#getPaymentProvider`.
 * Returns `undefined` for an empty/unrecognized id rather than throwing,
 * so an unset or typo'd `EMAIL_PROVIDER` degrades to "not configured"
 * instead of crashing order creation.
 */
export function getEmailProvider(id: string | null | undefined): EmailProvider | undefined {
  if (!id || !isEmailProviderId(id)) return undefined;
  return registry[id];
}
