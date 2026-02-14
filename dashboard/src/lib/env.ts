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
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  ENABLE_MAIL_PREVIEW_PAGE: zStringBoolean,
  ENABLE_ACCOUNT_VERIFICATION: zStringBoolean,
  TOTP_SECRET_ENCRYPTION_KEY: z.string().length(32),
  ENABLE_MONITORING: zStringBoolean,
  ENABLE_UPTIME_MONITORING: zStringBoolean,
  ENABLE_APP_TRACKING: zStringBoolean,
  APP_TRACKING_SITE_ID: z.string().optional(),
  ALLOW_CRAWLING: zStringBoolean,
  DEMO_DASHBOARD_ID: z.string().optional(),
  NEXT_PUBLIC_DEFAULT_LANGUAGE: z
    .enum(SUPPORTED_LANGUAGES)
    .optional()
    .default((process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE as SupportedLanguages) ?? 'en'),
  GITHUB_ID: z.string().optional().default(''),
  GITHUB_SECRET: z.string().optional().default(''),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  SESSION_REPLAYS_ENABLED: zStringBoolean,
  S3_ENABLED: zStringBoolean,
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: zStringBoolean,
  S3_SSE_ENABLED: zStringBoolean,
  OTEL_SERVICE_NAME: z.string().optional(),
  BACKGROUND_JOBS_ENABLED: zStringBoolean,
  IS_DEVELOPMENT: zStringBoolean,
});

export const env = envSchema.parse(process.env);

export const s3Env = {
  enabled: env.S3_ENABLED,
  bucket: env.S3_BUCKET,
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  accessKeyId: env.S3_ACCESS_KEY_ID,
  secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  sseEnabled: env.S3_SSE_ENABLED,
};
