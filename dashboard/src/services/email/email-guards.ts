import { EMAIL_TYPES, type EmailType } from '@/services/email/email-types';
import { z } from 'zod';

export type EmailGuardContext = {
  enableEmails: boolean;
  isCloud: boolean;
  isDevelopment: boolean;
};

const RecipientEmailSchema = z.string().trim().toLowerCase().email();

function recipientDomain(email: string): string | null {
  const parsed = RecipientEmailSchema.safeParse(email);
  if (!parsed.success) return null;

  const atIndex = parsed.data.lastIndexOf('@');
  return parsed.data.slice(atIndex + 1);
}

// Account deletion anonymizes the user's email to `deleted_<id>@deleted.invalid`.
function isDeletedAccountRecipient(email: string): boolean {
  return recipientDomain(email) === 'deleted.invalid';
}

function isBetterlyticsRecipient(email: string): boolean {
  return recipientDomain(email) === 'betterlytics.io';
}

export function emailSkipReason(type: EmailType, data: { to: string }, ctx: EmailGuardContext): string | null {
  if (!ctx.enableEmails) return 'ENABLE_EMAILS=false';
  if (EMAIL_TYPES[type].saasOnly && !ctx.isCloud) return `'${type}' is saasOnly`;
  if (isDeletedAccountRecipient(data.to)) return `deleted account recipient '${data.to}'`;
  if (ctx.isDevelopment && !isBetterlyticsRecipient(data.to)) {
    return `dev guard: non-@betterlytics.io recipient '${data.to}'`;
  }
  return null;
}
