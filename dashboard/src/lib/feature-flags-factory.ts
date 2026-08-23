import type { env } from '@/lib/env';

type FeatureFlagEnvironmentKeys =
  'PUBLIC_IS_CLOUD' | 'ENABLE_EMAILS' | 'ENABLE_UPTIME_MONITORING' | 'ENABLE_PUBLIC_STATUS_PAGES';
export type FeatureFlagEnvironment = {
  [K in FeatureFlagEnvironmentKeys]: (typeof env)[K];
};

export function createFeatureFlags(environment: FeatureFlagEnvironment) {
  return {
    enableBilling: environment.PUBLIC_IS_CLOUD,
    isCloud: environment.PUBLIC_IS_CLOUD,
    enableBugReports: environment.PUBLIC_IS_CLOUD,
    enableEmails: environment.ENABLE_EMAILS,
    enableUptimeMonitoring: environment.ENABLE_UPTIME_MONITORING,
    enablePublicStatusPages: environment.ENABLE_UPTIME_MONITORING && environment.ENABLE_PUBLIC_STATUS_PAGES,
  } as const;
}
