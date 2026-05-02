import { z } from 'zod';

const schema = z.object({
  POSTGRES_URL: z.string().min(1),
  CLICKHOUSE_URL: z.string().url(),
  WORKER_CLICKHOUSE_WRITE_USER: z.string().optional().default(''),
  WORKER_CLICKHOUSE_WRITE_PASSWORD: z.string().optional().default(''),
  WORKER_HEALTH_PORT: z.coerce.number().int().positive().optional().default(9090),
  ENABLE_MONITORING: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((v) => v === 'true'),
  BACKGROUND_JOBS_ENABLED: z
    .enum(['true', 'false'])
    .optional()
    .default('true')
    .transform((v) => v === 'true'),
  ENABLE_EMAILS: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((v) => v === 'true'),
  IS_CLOUD: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((v) => v === 'true'),
  MAILER_SEND_API_TOKEN: z.string().optional().default(''),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

export const workerEnv = schema.parse(process.env);
