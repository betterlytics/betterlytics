import { SUPPORTED_LANGUAGES, type SupportedLanguages } from '@/constants/i18n';
import { z } from 'zod';

export const zStringBoolean = z
  .enum(['true', 'false'])
  .optional()
  .default('false')
  .transform((val) => val === 'true');

const envSchema = z.object({
  CLICKHOUSE_URL: z.string().url(),
  CLICKHOUSE_DASHBOARD_USER: z.string().min(1),
  CLICKHOUSE_DASHBOARD_PASSWORD: z.string().min(1),
  ADMIN_EMAIL: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(1),
  PUBLIC_TRACKING_SERVER_ENDPOINT: z.string().min(1),
  PUBLIC_ANALYTICS_BASE_URL: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1),
  ENABLE_DASHBOARD_TRACKING: zStringBoolean,
  ENABLE_REGISTRATION: zStringBoolean,
  PUBLIC_BASE_URL: z.string().optional().default('https://betterlytics.io'),
  PUBLIC_IS_CLOUD: zStringBoolean,
  IS_CLOUD: zStringBoolean,
  ENABLE_BILLING: zStringBoolean,
  PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional().default(''),
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
  ENABLE_EMAILS: zStringBoolean,
  MAILER_SEND_API_TOKEN: z.string().optional().default(''),
  ENABLE_MAIL_PREVIEW_PAGE: zStringBoolean,
  ENABLE_ACCOUNT_VERIFICATION: zStringBoolean,
  TOTP_SECRET_ENCRYPTION_KEY: z.string().length(32),
  ENABLE_MONITORING: zStringBoolean,
  ENABLE_APP_TRACKING: zStringBoolean,
  APP_TRACKING_SITE_ID: z.string().optional(),
  NEXT_PUBLIC_DEFAULT_LANGUAGE: z
    .enum(SUPPORTED_LANGUAGES)
    .optional()
    .default((process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE as SupportedLanguages) ?? 'en'),
  GITHUB_ID: z.string().optional().default(''),
  GITHUB_SECRET: z.string().optional().default(''),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  MISTRAL_API_KEY: z.string().optional().default(''),
});

export const env = envSchema.parse(process.env);
