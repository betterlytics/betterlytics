import { EMAIL_TYPES, type EmailType } from '@/services/email/email-types';

export type EmailGuardContext = {
  enableEmails: boolean;
  isCloud: boolean;
  isDevelopment: boolean;
};

export function emailSkipReason(type: EmailType, data: { to: string }, ctx: EmailGuardContext): string | null {
  if (!ctx.enableEmails) return 'ENABLE_EMAILS=false';
  if (EMAIL_TYPES[type].saasOnly && !ctx.isCloud) return `'${type}' is saasOnly`;
  if (ctx.isDevelopment && !data.to.includes('@betterlytics.io')) {
    return `dev guard: non-@betterlytics.io recipient '${data.to}'`;
  }
  return null;
}
