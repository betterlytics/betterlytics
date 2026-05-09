import { EMAIL_TYPES, type EmailType } from '@/services/email/email-types';
import { z } from 'zod';

export type EmailGuardContext = {
  enableEmails: boolean;
  isCloud: boolean;
  isDevelopment: boolean;
};

const DevRecipientEmailSchema = z.string().trim().toLowerCase().email();

function isBetterlyticsRecipient(email: string): boolean {
  const parsed = DevRecipientEmailSchema.safeParse(email);
  if (!parsed.success) return false;

  const atIndex = parsed.data.lastIndexOf('@');
  return parsed.data.slice(atIndex + 1) === 'betterlytics.io';
}

export function emailSkipReason(type: EmailType, data: { to: string }, ctx: EmailGuardContext): string | null {
  if (!ctx.enableEmails) return 'ENABLE_EMAILS=false';
  if (EMAIL_TYPES[type].saasOnly && !ctx.isCloud) return `'${type}' is saasOnly`;
  if (ctx.isDevelopment && !isBetterlyticsRecipient(data.to)) {
    return `dev guard: non-@betterlytics.io recipient '${data.to}'`;
  }
  return null;
}
