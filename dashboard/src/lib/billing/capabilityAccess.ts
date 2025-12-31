'server-only';

import { getUserBillingData } from '@/actions/billing.action';
import { getCapabilitiesForTier, PlanCapabilities } from './capabilities';
import { UserException } from '@/lib/exceptions';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { PLAN_CAPABILITIES } from './capabilities';

export async function getCapabilities(): Promise<PlanCapabilities> {
  if (!isFeatureEnabled('enableBilling')) {
    return PLAN_CAPABILITIES.enterprise;
  }

  const billing = await getUserBillingData();

  if (!billing.success) {
    throw new UserException('Unable to verify subscription status');
  }

  return getCapabilitiesForTier(billing.data.subscription.tier);
}

export function requireCapability(allowed: boolean, message: string): void {
  if (!allowed) {
    throw new UserException(message);
  }
}
