import type { Stripe } from 'stripe';
import type { TierName } from '@/lib/billing/plans';

export type PlanStatus = 'active' | 'canceling' | 'pastDue' | 'inactive';

export function derivePlanStatus(status: string, cancelAtPeriodEnd: boolean): PlanStatus {
  if (status === 'past_due' || status === 'unpaid') return 'pastDue';
  if (cancelAtPeriodEnd) return 'canceling';
  if (status === 'active' || status === 'trialing') return 'active';
  return 'inactive';
}

const FREE_TIER: TierName = 'growth';

// Single source of truth for how Stripe subscription statuses map to behavior.

// Statuses that grant the subscription's PAID tier capabilities. Anything else (past_due, unpaid,
// incomplete, ...) falls back to the free tier — i.e. a failed payment downgrades access.
export const CAPABILITY_ENTITLED_STATUSES = new Set<string>([
  'active',
  'trialing',
] satisfies Stripe.Subscription.Status[]);

// Statuses where the local row keeps the paid tier (still a subscribed customer, possibly in
// dunning). Capabilities are still gated separately by CAPABILITY_ENTITLED_STATUSES.
export const TIER_RETAINING_STATUSES = new Set<string>([
  'active',
  'trialing',
  'past_due',
] satisfies Stripe.Subscription.Status[]);

// Statuses that count as an existing live subscription, used to stop a customer starting a second
// subscription via checkout.
export const LIVE_SUBSCRIPTION_STATUSES = new Set<string>([
  'active',
  'trialing',
  'past_due',
  'unpaid',
] satisfies Stripe.Subscription.Status[]);

// Terminal statuses: the subscription is permanently gone; detach the Stripe link and reset to free.
export const TERMINAL_STATUSES = new Set<string>([
  'canceled',
  'incomplete_expired',
] satisfies Stripe.Subscription.Status[]);

export function resolveEntitledTier(subscription: { tier: TierName; status: string }): TierName {
  return CAPABILITY_ENTITLED_STATUSES.has(subscription.status) ? subscription.tier : FREE_TIER;
}
