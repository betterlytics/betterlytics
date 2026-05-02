import { z } from 'zod';
import { sharedEmailEnvSchema, zStringBoolean } from './shared.env';

const workerOnlyEnvSchema = z.object({
  POSTGRES_URL: z.string().min(1),
  CLICKHOUSE_URL: z.string().url(),
  WORKER_CLICKHOUSE_WRITE_USER: z.string().optional().default(''),
  WORKER_CLICKHOUSE_WRITE_PASSWORD: z.string().optional().default(''),
  WORKER_HEALTH_PORT: z.coerce.number().int().positive().optional().default(9090),
  ENABLE_MONITORING: zStringBoolean,
  BACKGROUND_JOBS_ENABLED: z
    .enum(['true', 'false'])
    .optional()
    .default('true')
    .transform((v) => v === 'true'),
  ENABLE_EMAILS: zStringBoolean,
  MAILER_SEND_API_TOKEN: z.string().optional().default(''),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

const workerEnvSchema = sharedEmailEnvSchema.merge(workerOnlyEnvSchema);

export const workerEnv = workerEnvSchema.parse(process.env);
