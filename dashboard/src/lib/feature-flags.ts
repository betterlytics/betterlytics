import { env } from './env';

/**
 * Feature flags for controlling application behavior in different environments
 */
export const featureFlags = {
  enableDashboardTracking: env.ENABLE_DASHBOARD_TRACKING,
  enableRegistration: env.ENABLE_REGISTRATION,
  enableEmails: env.ENABLE_EMAILS,
  enableEmailPreview: env.ENABLE_MAIL_PREVIEW_PAGE,
  enableAccountVerification: env.ENABLE_ACCOUNT_VERIFICATION,
  enableBilling: env.ENABLE_BILLING,
  enableSessionReplay: env.SESSION_REPLAYS_ENABLED,
  enableBugReports: env.IS_CLOUD,
  enableUptimeMonitoring: env.ENABLE_UPTIME_MONITORING,
} as const;

export function isFeatureEnabled(flag: keyof typeof featureFlags): boolean {
  return featureFlags[flag];
}

type FeatureFlagGuardResponse<T> =
  | {
      enabled: true;
      value: T;
    }
  | {
      enabled: false;
    };
/**
 * This is used to simplify the usage of feature flags for blocking server actions
 * and hiding UI elements.
 *
 * Usage:
 *
 * ```ts
 * const billingDataPromiseGuard = featureFlagGuard('enableBilling', () => getUserBillingData());
 * ...
 * <div>
 *   {billingDataPromiseGuard.enabled && (
 *     <PlanQuota billingDataPromise={billingDataPromiseGuard.value} />
 *   )}
 * </div>
 * ```
 *
 * If regular `isFeatureEnabled` is used, you'll have code like the following, where you need to re-check that the feature flag is enabled, and that the promise not not null.:
 *
 * ```ts
 * const billingDataPromise = isFeatureEnabled('enableBilling') ? getUserBillingData() : null;
 * ...
 * <div>
 *   {isFeatureEnabled('enableBilling') && billingDataPromise && (
 *     <PlanQuota billingDataPromise={billingDataPromise} />
 *   )}
 * </div>
 * ```
 */
export function featureFlagGuard<T>(
  flag: keyof typeof featureFlags,
  factory: () => T,
): FeatureFlagGuardResponse<T> {
  if (!isFeatureEnabled(flag)) {
    return { enabled: false };
  }

  return { enabled: true, value: factory() };
}
