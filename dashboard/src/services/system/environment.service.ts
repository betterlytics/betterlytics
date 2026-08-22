import 'server-only';

import { env } from '@/lib/env';

type PublicPrefixedKey = keyof typeof env & `PUBLIC_${string}`;

/**
 * Non-`PUBLIC_` feature flags that are safe to expose to the client.
 * They reveal feature availability only, never secrets.
 */
const EXPOSED_FEATURE_FLAG_KEYS = ['ENABLE_EMAILS'] as const satisfies readonly (keyof typeof env)[];

export const PUBLIC_ENVIRONMENT_VARIABLES_KEYS: readonly (
  PublicPrefixedKey | (typeof EXPOSED_FEATURE_FLAG_KEYS)[number]
)[] = [
  ...(Object.keys(env).filter((key) => key.startsWith('PUBLIC_')) as PublicPrefixedKey[]),
  ...EXPOSED_FEATURE_FLAG_KEYS,
];

export type PublicEnvironmentVariableKeys = (typeof PUBLIC_ENVIRONMENT_VARIABLES_KEYS)[number];

export type PublicEnvironmentVariables = {
  [K in PublicEnvironmentVariableKeys]: (typeof env)[K];
};

export function getPublicEnvironmentVariables() {
  return PUBLIC_ENVIRONMENT_VARIABLES_KEYS.reduce(
    (vars, key) => ({
      ...vars,
      [key]: env[key],
    }),
    {} as PublicEnvironmentVariables,
  );
}
