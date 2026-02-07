'server-only';

import { getUserBillingData } from '@/actions/billing.action';
import { getCapabilitiesForTier, PlanCapabilities, isEmailReportsEnabled } from './capabilities';
import { UserException } from '@/lib/exceptions';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { PLAN_CAPABILITIES } from './capabilities';
import { findDashboardOwner } from '@/repositories/postgres/dashboard.repository';
import { getUserSubscription } from '@/repositories/postgres/subscription.repository';

export async function getUserCapabilities(): Promise<PlanCapabilities> {
  if (!isFeatureEnabled('enableBilling')) {
    return PLAN_CAPABILITIES.enterprise;
  }

  const billing = await getUserBillingData();

  if (!billing.success) {
    throw new Error('Unable to verify subscription status');
  }

  return getCapabilitiesForTier(billing.data.subscription.tier);
}

export async function getDashboardCapabilities(dashboardId: string): Promise<PlanCapabilities> {
  if (!isFeatureEnabled('enableBilling')) {
    return PLAN_CAPABILITIES.enterprise;
  }

  const owner = await findDashboardOwner(dashboardId);
  if (!owner) {
    throw new Error('Dashboard owner not found');
  }

  const subscription = await getUserSubscription(owner.userId);
  if (!subscription) {
    throw new Error('Unable to verify subscription status');
  }

  return getCapabilitiesForTier(subscription.tier);
}

export function requireCapability(allowed: boolean, message: string): void {
  if (!allowed) {
    throw new UserException(message);
  }
}

export async function canDashboardReceiveReports(dashboardId: string): Promise<boolean> {
  const owner = await findDashboardOwner(dashboardId);
  if (!owner) {
    return false;
  }

  const subscription = await getUserSubscription(owner.userId);
  if (!subscription) {
    return false;
  }

  return isEmailReportsEnabled(subscription.tier);
}
