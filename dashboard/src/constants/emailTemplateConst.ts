export const EMAIL_TEMPLATES = ['welcome', 'reset-password', 'usage-alert', 'first-payment-welcome'] as const;

export type EmailTemplateType = (typeof EMAIL_TEMPLATES)[number];
