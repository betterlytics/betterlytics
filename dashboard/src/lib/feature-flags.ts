import { env } from './env';

/**
 * Feature flags for controlling application behavior in different environments
 */
export const featureFlags = {
  enableDashboardTracking: env.ENABLE_DASHBOARD_TRACKING,
  enableRegistration: env.ENABLE_REGISTRATION,
  enableEmails: env.ENABLE_EMAILS,
  enableEmailPreview: env.ENABLE_MAIL_PREVIEW_PAGE,
  enableBilling: env.ENABLE_BILLING,
} as const;

export function isFeatureEnabled(flag: keyof typeof featureFlags): boolean {
  return featureFlags[flag];
}
