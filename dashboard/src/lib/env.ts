import { z } from 'zod';

const envSchema = z.object({
  CLICKHOUSE_URL: z.string().url(),
  CLICKHOUSE_DASHBOARD_USER: z.string().min(1),
  CLICKHOUSE_DASHBOARD_PASSWORD: z.string().min(1),
  ADMIN_EMAIL: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(1),
  NEXT_PUBLIC_TRACKING_SERVER_ENDPOINT: z.string().min(1),
  ENABLE_DASHBOARD_TRACKING: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
  ENABLE_REGISTRATION: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
  NEXT_PUBLIC_BASE_URL: z.string().optional().default('http://localhost:3000'),
  NEXT_PUBLIC_IS_CLOUD: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  IS_CLOUD: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
  ENABLE_BILLING: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional().default(''),
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
  ENABLE_EMAILS: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
  MAILER_SEND_API_TOKEN: z.string().optional().default(''),
  ENABLE_MAIL_PREVIEW_PAGE: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
});

export const env = envSchema.parse(process.env);
