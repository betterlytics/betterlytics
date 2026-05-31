import type { TierName } from '@/lib/billing/plans';

export type PlanStatus = 'active' | 'canceling' | 'pastDue' | 'inactive';

export function derivePlanStatus(status: string, cancelAtPeriodEnd: boolean): PlanStatus {
  if (status === 'past_due' || status === 'unpaid') return 'pastDue';
  if (cancelAtPeriodEnd) return 'canceling';
  if (status === 'active' || status === 'trialing') return 'active';
  return 'inactive';
}

const FREE_TIER: TierName = 'growth';

const CAPABILITY_ENTITLED_STATUSES = new Set<string>(['active', 'trialing']);

export function resolveEntitledTier(subscription: { tier: TierName; status: string }): TierName {
  return CAPABILITY_ENTITLED_STATUSES.has(subscription.status) ? subscription.tier : FREE_TIER;
}
