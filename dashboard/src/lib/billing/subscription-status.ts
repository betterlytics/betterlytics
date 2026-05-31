export type PlanStatus = 'active' | 'canceling' | 'pastDue' | 'inactive';

export function derivePlanStatus(status: string, cancelAtPeriodEnd: boolean): PlanStatus {
  if (status === 'past_due' || status === 'unpaid') return 'pastDue';
  if (cancelAtPeriodEnd) return 'canceling';
  if (status === 'active' || status === 'trialing') return 'active';
  return 'inactive';
}
