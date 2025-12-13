'server only';
import { env } from '@/lib/env';

export const PUBLIC_ENVIRONMENT_VARIABLES_KEYS = Object.keys(env).filter((key) =>
  key.startsWith('PUBLIC_'),
) as readonly (keyof typeof env & `PUBLIC_${string}`)[];

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
