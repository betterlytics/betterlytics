import { z } from 'zod';

const envSchema = z.object({
  CLICKHOUSE_URL: z.string().url(),
  CLICKHOUSE_DASHBOARD_USER: z.string().min(1),
  CLICKHOUSE_DASHBOARD_PASSWORD: z.string().min(1),
  ADMIN_EMAIL: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(1),
  NEXT_PUBLIC_TRACKING_SERVER_ENDPOINT: z.string().min(1),
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
});

export const env = envSchema.parse(process.env);
