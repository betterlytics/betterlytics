import { z } from 'zod';

// Plain Error on purpose: Next assigns to err.message while ZodError's is getter-only, masking the issues
export function parseEnv<T extends z.ZodType>(label: string, schema: T, source: unknown = process.env): z.output<T> {
  const result = schema.safeParse(source);
  if (result.success) {
    return result.data;
  }
  const issues = result.error.issues
    .map((issue) => `${issue.path.join('.') || '(env)'}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment variables (${label}): ${issues}. Check the environment passed to the dashboard.`);
}
