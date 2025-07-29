import { env } from '@/lib/env';
import { createFeatureFlags } from './feature-flags-factory';
import { lazyCache } from '@/lib/lazy-cache';

/**
 * Client-side feature flags
 */
const getFeatureFlags = lazyCache(() => createFeatureFlags(env));

export function isClientFeatureEnabled(flag: keyof ReturnType<typeof getFeatureFlags>): boolean {
  const clientFeatureFlags = getFeatureFlags();
  return clientFeatureFlags[flag];
}
