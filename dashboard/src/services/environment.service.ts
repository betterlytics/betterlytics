'server only';
import { env } from '@/lib/env';

export const PUBLIC_ENVIRONMENT_VARIABLES_KEYS = [
  'NEXT_PUBLIC_TRACKING_SERVER_ENDPOINT',
  'NEXT_PUBLIC_ANALYTICS_BASE_URL',
  'NEXT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_IS_CLOUD',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
] as const;

type PublicEnvironmentVariableKeys = (typeof PUBLIC_ENVIRONMENT_VARIABLES_KEYS)[number];

export type PublicEnvironmentVariables = {
  [K in PublicEnvironmentVariableKeys]: (typeof env)[K];
};

export function getPublicEnvironmentVaraibles() {
  return PUBLIC_ENVIRONMENT_VARIABLES_KEYS.reduce(
    (vars, key) => ({
      ...vars,
      [key]: env[key],
    }),
    {} as PublicEnvironmentVariables,
  );
}
