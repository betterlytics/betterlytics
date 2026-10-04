import { z } from 'zod';
import { parseEnv } from './parse-env';

export const zStringBoolean = z
  .enum(['true', 'false'])
  .optional()
  .default('false')
  .transform((val) => val === 'true');

export const zStringBooleanDefaultTrue = z
  .enum(['true', 'false'])
  .optional()
  .default('true')
  .transform((val) => val === 'true');

export const sharedEmailEnvSchema = z.object({
  IS_CLOUD: zStringBoolean,
  PUBLIC_BASE_URL: z.string().url(),
});

const parsedSharedEmailEnv = parseEnv('shared', sharedEmailEnvSchema);

export const sharedEmailEnv = {
  isCloud: parsedSharedEmailEnv.IS_CLOUD,
  publicBaseUrl: parsedSharedEmailEnv.PUBLIC_BASE_URL,
};
