import { z } from 'zod';

const schema = z.object({
  POSTGRES_URL: z.string().min(1),
  CLICKHOUSE_URL: z.string().url(),
  WORKER_CLICKHOUSE_WRITE_USER: z.string().min(1),
  WORKER_CLICKHOUSE_WRITE_PASSWORD: z.string().min(1),
  WORKER_HEALTH_PORT: z.coerce.number().int().positive().optional().default(9090),
});

export const workerEnv = schema.parse(process.env);
