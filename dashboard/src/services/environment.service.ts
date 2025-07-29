'server only';
import { getEnv } from '@/lib/env';
import { lazyCache } from '@/lib/lazy-cache';

export type PublicEnvironmentVariableKeys = keyof ReturnType<typeof getEnv> & `PUBLIC_${string}`;
export type PublicEnvironmentVariables = {
  [K in PublicEnvironmentVariableKeys]: ReturnType<typeof getEnv>[K];
};

const getPublicEnvironmentVariablesCache = lazyCache(() => {
  const env = getEnv();
  const keys = Object.keys(env).filter((key) => key.startsWith('PUBLIC_')) as PublicEnvironmentVariableKeys[];

  return keys.reduce(
    (vars, key) => ({
      ...vars,
      [key]: env[key],
    }),
    {} as PublicEnvironmentVariables,
  );
});

export function getPublicEnvironmentVariables() {
  return getPublicEnvironmentVariablesCache();
}
