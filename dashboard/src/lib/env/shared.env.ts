import { z } from 'zod';

export const zStringBoolean = z
  .enum(['true', 'false'])
  .optional()
  .default('false')
  .transform((val) => val === 'true');

export const sharedEmailEnvSchema = z.object({
  IS_CLOUD: zStringBoolean,
  PUBLIC_BASE_URL: z.string().url(),
});

const parsedSharedEmailEnv = sharedEmailEnvSchema.parse(process.env);

export const sharedEmailEnv = {
  isCloud: parsedSharedEmailEnv.IS_CLOUD,
  publicBaseUrl: parsedSharedEmailEnv.PUBLIC_BASE_URL,
};
