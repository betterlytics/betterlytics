export const EMAIL_TEMPLATES = [
  'reset-password',
  'usage-alert',
  'first-payment-welcome',
  'weekly-report',
  'data-retention-clamp',
] as const;

export type EmailTemplateType = (typeof EMAIL_TEMPLATES)[number];
