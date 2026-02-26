import type { env } from '@/lib/env';

type FeatureFlagEnvironmentKeys = 'PUBLIC_IS_CLOUD' | 'PUBLIC_ENABLE_INTEGRATIONS';
export type FeatureFlagEnvironment = {
  [K in FeatureFlagEnvironmentKeys]: (typeof env)[K];
};

export function createFeatureFlags(environment: FeatureFlagEnvironment) {
  return {
    enableBilling: environment.PUBLIC_IS_CLOUD,
    isCloud: environment.PUBLIC_IS_CLOUD,
    enableBugReports: environment.PUBLIC_IS_CLOUD,
    enableIntegrations: environment.PUBLIC_ENABLE_INTEGRATIONS,
  } as const;
}
