import { z } from 'zod';

const envSchema = z.object({
  CLICKHOUSE_URL: z.string().url(),
  CLICKHOUSE_DASHBOARD_USER: z.string().min(1),
  CLICKHOUSE_DASHBOARD_PASSWORD: z.string().min(1),
  ADMIN_EMAIL: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(1),
  ENABLE_DASHBOARD_TRACKING: z
    .boolean({
      coerce: true,
    })
    .optional()
    .default(false),
  ENABLE_REGISTRATION: z
    .boolean({
      coerce: true,
    })
    .optional()
    .default(false),
  IS_CLOUD: z
    .boolean({
      coerce: true,
    })
    .optional()
    .default(false),
  NEXT_PUBLIC_BASE_URL: z.string().optional().default('http://localhost:3000'),
  NEXT_PUBLIC_IS_CLOUD: z
    .boolean({
      coerce: true,
    })
    .optional()
    .default(false),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional().default(''),
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
});

export const env = envSchema.parse(process.env);
