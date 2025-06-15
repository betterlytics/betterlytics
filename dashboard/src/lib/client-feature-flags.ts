/**
 * Client-side feature flags
 */
export const clientFeatureFlags = {
  enableBilling: process.env.NEXT_PUBLIC_IS_CLOUD === 'true',
} as const;

export function isClientFeatureEnabled(flag: keyof typeof clientFeatureFlags): boolean {
  return clientFeatureFlags[flag];
}
