import type { env } from '@/lib/env';

type FeatureFlagEnvironmentKeys = 'NEXT_PUBLIC_IS_CLOUD';
export type FeatureFlagEnvironment = {
  [K in FeatureFlagEnvironmentKeys]: (typeof env)[K];
};

export function createFeatureFlags(environment: FeatureFlagEnvironment) {
  return {
    enableBilling: environment.NEXT_PUBLIC_IS_CLOUD,
    isCloud: environment.NEXT_PUBLIC_IS_CLOUD,
  } as const;
}
