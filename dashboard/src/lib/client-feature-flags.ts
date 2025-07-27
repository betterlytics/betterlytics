import { env } from '@/lib/env';
import { createFeatureFlags } from './feature-flags-factory';

/**
 * Client-side feature flags
 */
export const clientFeatureFlags = createFeatureFlags(env);

export function isClientFeatureEnabled(flag: keyof typeof clientFeatureFlags): boolean {
  return clientFeatureFlags[flag];
}
