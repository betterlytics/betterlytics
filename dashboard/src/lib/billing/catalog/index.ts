import type { PlanCapabilities } from '@/lib/billing/capabilities';
import { CAPABILITY_ENTITLED_STATUSES } from '@/lib/billing/subscription-status';
import { CUSTOM_VOLUME, EVENT_STEPS, FREE_PLAN_ID, PLANS, RENAMED_PLAN_IDS, SELF_HOSTED_PLAN_ID } from './plans';
import {
  type BillingInterval,
  type PlanCurrency,
  type PlanDefinition,
  type PlanId,
  type PriceBand,
} from './types';

export * from './types';
export { EVENT_STEPS } from './plans';

export const VOLUME_STOPS: readonly number[] = [...EVENT_STEPS, CUSTOM_VOLUME];

const PLANS_BY_RANK = Object.values(PLANS).sort((a, b) => a.rank - b.rank);

export function getPlan(id: PlanId): PlanDefinition {
  return PLANS[id];
}

/** Maps a stored plan id that was renamed at launch to its current id; other ids pass through. */
export function currentPlanId(storedId: string): string {
  return RENAMED_PLAN_IDS.get(storedId) ?? storedId;
}

export function listedPlans(): PlanDefinition[] {
  return PLANS_BY_RANK.filter((plan) => plan.listed);
}

export function freePlan(): PlanDefinition {
  return PLANS[FREE_PLAN_ID];
}

export function selfHostedPlan(): PlanDefinition {
  return PLANS[SELF_HOSTED_PLAN_ID];
}

const LARGEST_STEP = EVENT_STEPS[EVENT_STEPS.length - 1];

function isCustomVolume(events: number): boolean {
  return events > LARGEST_STEP;
}

export function bandFor(plan: PlanDefinition, events: number): PriceBand | undefined {
  return plan.bands.find((band) => band.events === events);
}

function isZeroPriced(band: PriceBand, interval: BillingInterval): boolean {
  const prices = band.prices[interval];
  return prices !== undefined && Object.values(prices).every((cents) => cents === 0);
}

export function isFreeBand(plan: PlanDefinition, events: number, interval: BillingInterval = 'month'): boolean {
  const band = bandFor(plan, events);
  return band !== undefined && isZeroPriced(band, interval);
}

function freeBand(plan: PlanDefinition): PriceBand | undefined {
  return plan.bands.find((band) => isZeroPriced(band, 'month'));
}

/** A plan that is only ever free, at one fixed allowance. */
export function isFreePlan(plan: PlanDefinition): boolean {
  return plan.bands.length === 1 && isZeroPriced(plan.bands[0], 'month');
}

/** Price in cents, or null when the plan has no self-serve price at that volume. */
export function priceFor(
  plan: PlanDefinition,
  events: number,
  currency: PlanCurrency,
  interval: BillingInterval = 'month',
): number | null {
  return bandFor(plan, events)?.prices[interval]?.[currency] ?? null;
}

export type PlanOffer =
  | { kind: 'free'; events: number }
  | { kind: 'paid'; events: number; cents: number }
  | { kind: 'quoted'; events: number };

/**
 * What a plan's card offers at a slider volume. A free plan keeps its own allowance, and a self-serve plan
 * past its largest step offers that step.
 */
export function offerFor(
  plan: PlanDefinition,
  events: number,
  currency: PlanCurrency,
  interval: BillingInterval = 'month',
): PlanOffer {
  if (isFreePlan(plan)) return { kind: 'free', events: plan.bands[0].events };
  if (!plan.selfServe) return { kind: 'quoted', events };

  const offered = Math.min(events, LARGEST_STEP);
  const cents = priceFor(plan, offered, currency, interval);
  return cents === null ? { kind: 'quoted', events: offered } : { kind: 'paid', events: offered, cents };
}

/** Whether a plan covers a slider volume: a free plan its allowance, self-serve plans the slider steps, sales-only plans any volume. */
export function fitsVolume(plan: PlanDefinition, events: number): boolean {
  if (isFreePlan(plan)) return events <= plan.bands[0].events;
  return !plan.selfServe || !isCustomVolume(events);
}

/** The plan a pricing page highlights at a slider volume: the featured plan while it fits, otherwise the first that does. */
export function recommendedPlanFor(events: number): PlanDefinition | null {
  const fitting = listedPlans().filter((plan) => fitsVolume(plan, events));
  return fitting.find((plan) => plan.featured) ?? fitting[0] ?? null;
}

/** Whether a card shows exactly what an account has. A retired price is no longer sold, so it matches no paid card. */
export function isCurrentOffer(
  subscription: { planId: PlanId; eventLimit: number; pricePerMonth: number; currency: PlanCurrency },
  plan: PlanDefinition,
  offer: PlanOffer,
  currency: PlanCurrency,
): boolean {
  if (isFreePlan(plan)) return isFreePlan(PLANS[subscription.planId]);
  return (
    offer.kind === 'paid' &&
    subscription.planId === plan.id &&
    subscription.eventLimit === offer.events &&
    subscription.currency === currency &&
    subscription.pricePerMonth === offer.cents
  );
}

export type LookupKeyMatch = { plan: PlanDefinition; events: number; interval: BillingInterval };

const LOOKUP_KEY_INDEX = new Map<string, LookupKeyMatch>();
for (const plan of PLANS_BY_RANK) {
  for (const band of plan.bands) {
    for (const [interval, lookupKey] of Object.entries(band.lookupKeys) as [BillingInterval, string][]) {
      LOOKUP_KEY_INDEX.set(lookupKey, { plan, events: band.events, interval });
    }
  }
  for (const legacy of plan.legacyPrices) {
    LOOKUP_KEY_INDEX.set(legacy.lookupKey, { plan, events: legacy.events, interval: legacy.interval });
  }
}

/** Resolves any Stripe lookup key we have ever sold, current or retired. */
export function planForLookupKey(lookupKey: string): LookupKeyMatch | null {
  return LOOKUP_KEY_INDEX.get(lookupKey) ?? null;
}

export function purchasableLookupKey(
  planId: PlanId,
  events: number,
  interval: BillingInterval = 'month',
): string | null {
  const plan = PLANS[planId];
  if (!plan.listed || !plan.selfServe) return null;

  const band = bandFor(plan, events);
  if (!band || isZeroPriced(band, interval)) return null;

  return band.lookupKeys[interval] ?? null;
}

/** The cheapest listed plan whose capabilities pass the check, used to name the plan an upgrade unlocks. */
export function planThatUnlocks(check: (capabilities: PlanCapabilities) => boolean): PlanDefinition | null {
  return listedPlans().find((plan) => check(plan.capabilities)) ?? null;
}

export function upgradeFor(
  capabilities: PlanCapabilities,
  check: (capabilities: PlanCapabilities) => boolean,
): PlanDefinition | null {
  return check(capabilities) ? null : planThatUnlocks(check);
}

/** A failed or unpaid subscription keeps its plan on record but gets the free plan's capabilities. */
export function entitledPlan(subscription: { planId: PlanId; status: string }): PlanDefinition {
  return CAPABILITY_ENTITLED_STATUSES.has(subscription.status) ? PLANS[subscription.planId] : freePlan();
}

export function freeSubscriptionDefaults() {
  const plan = freePlan();
  const band = freeBand(plan);
  if (!band) {
    throw new Error(`Free plan ${plan.id} has no zero-priced band`);
  }

  return {
    planId: plan.id,
    eventLimit: band.events,
    pricePerMonth: 0,
    currency: 'USD' as const,
    status: 'active' as const,
    cancelAtPeriodEnd: false,
  };
}
