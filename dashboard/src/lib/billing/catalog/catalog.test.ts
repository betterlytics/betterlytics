import { describe, expect, it } from 'vitest';
import { Currency } from '@prisma/client';
import {
  EVENT_STEPS,
  PLAN_CURRENCIES,
  PLAN_IDS,
  VOLUME_STOPS,
  bandFor,
  entitledPlan,
  freePlan,
  freeSubscriptionDefaults,
  getPlan,
  isFreeBand,
  isFreePlan,
  listedPlans,
  offerFor,
  planForLookupKey,
  planThatUnlocks,
  priceFor,
  purchasableLookupKey,
  selfHostedPlan,
  upgradeFor,
} from '@/lib/billing/catalog';
import { PLANS } from './plans';

const ALL_PLANS = Object.values(PLANS);

const ALL_CHECKS = {
  httpMethodConfigurable: true,
  customStatusCodes: true,
  customHeaders: true,
  keywordValidation: true,
};

describe('catalog invariants', () => {
  it('keys every plan by its own id and covers every stored plan id', () => {
    expect(Object.keys(PLANS).sort()).toEqual([...PLAN_IDS].sort());
    for (const [id, plan] of Object.entries(PLANS)) {
      expect(plan.id).toBe(id);
    }
  });

  it('prices in exactly the currencies the database accepts', () => {
    expect([...PLAN_CURRENCIES].sort()).toEqual(Object.values(Currency).sort());
  });

  it('uses every Stripe lookup key once across bands and retired prices', () => {
    const keys = ALL_PLANS.flatMap((plan) => [
      ...plan.bands.flatMap((band) => Object.values(band.lookupKeys)),
      ...plan.legacyPrices.map((legacy) => legacy.lookupKey),
    ]);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('gives every listed paid plan a price at every slider step, rising with volume', () => {
    for (const plan of listedPlans().filter((p) => p.selfServe && !isFreePlan(p))) {
      expect(plan.bands.map((band) => band.events)).toEqual([...EVENT_STEPS]);
      for (const currency of PLAN_CURRENCIES) {
        const prices = EVENT_STEPS.map((events) => priceFor(plan, events, currency)!);
        expect([...prices].sort((a, b) => a - b)).toEqual(prices);
      }
    }
  });

  it('starts new accounts on a zero-priced band of the free plan', () => {
    const defaults = freeSubscriptionDefaults();
    expect(defaults.planId).toBe(freePlan().id);
    expect(isFreeBand(freePlan(), defaults.eventLimit)).toBe(true);
    expect(defaults.pricePerMonth).toBe(0);
  });

  it('ends the slider on a quoted volume past the largest step', () => {
    expect(VOLUME_STOPS.slice(0, -1)).toEqual([...EVENT_STEPS]);
    expect(VOLUME_STOPS.at(-1)).toBeGreaterThan(EVENT_STEPS[EVENT_STEPS.length - 1]);
  });
});

describe('plans on sale', () => {
  const DOLLARS = {
    plus: [9, 14, 19, 29, 49, 69, 89, 129, 169],
    business: [19, 24, 29, 44, 74, 104, 134, 194, 254],
  } as const;

  it('lists Free, Plus, Business and Enterprise', () => {
    expect(listedPlans().map((plan) => plan.id)).toEqual(['free', 'plus', 'business', 'enterprise']);
  });

  it.each(Object.entries(DOLLARS))('prices %s at every step, with EUR equal to USD', (planId, dollars) => {
    const plan = getPlan(planId as keyof typeof DOLLARS);
    EVENT_STEPS.forEach((events, index) => {
      expect(priceFor(plan, events, 'USD')).toBe(dollars[index] * 100);
      expect(priceFor(plan, events, 'EUR')).toBe(dollars[index] * 100);
      expect(bandFor(plan, events)?.lookupKeys.month).toBe(`${planId}_${events}_month`);
    });
  });

  it('starts new accounts on Free at 10k events', () => {
    expect(freeSubscriptionDefaults()).toEqual({
      planId: 'free',
      eventLimit: 10_000,
      pricePerMonth: 0,
      currency: 'USD',
      status: 'active',
      cancelAtPeriodEnd: false,
    });
  });

  it('gives each plan exactly the agreed limits and service', () => {
    expect(getPlan('free').capabilities).toEqual({
      dashboards: { maxDashboards: 1, maxMembers: 1 },
      monitoring: { maxMonitors: 1, minIntervalSeconds: 300, ...ALL_CHECKS },
      emailReports: { emailReportsEnabled: false },
      dataRetention: { maxDataRetentionDays: 365 },
      statusPages: { maxStatusPages: 1, customDomain: false, removeBranding: false },
    });
    expect(getPlan('plus').capabilities).toEqual({
      dashboards: { maxDashboards: 5, maxMembers: 3 },
      monitoring: { maxMonitors: 5, minIntervalSeconds: 60, ...ALL_CHECKS },
      emailReports: { emailReportsEnabled: true },
      dataRetention: { maxDataRetentionDays: 730 },
      statusPages: { maxStatusPages: 1, customDomain: true, removeBranding: false },
    });
    expect(getPlan('business').capabilities).toEqual({
      dashboards: { maxDashboards: 25, maxMembers: 25 },
      monitoring: { maxMonitors: 50, minIntervalSeconds: 60, ...ALL_CHECKS },
      emailReports: { emailReportsEnabled: true },
      dataRetention: { maxDataRetentionDays: 1095 },
      statusPages: { maxStatusPages: 3, customDomain: true, removeBranding: true },
    });
    expect(getPlan('enterprise').capabilities).toEqual({
      dashboards: { maxDashboards: 9999, maxMembers: 9999 },
      monitoring: { maxMonitors: 9999, minIntervalSeconds: 60, ...ALL_CHECKS },
      emailReports: { emailReportsEnabled: true },
      dataRetention: { maxDataRetentionDays: 1825 },
      statusPages: { maxStatusPages: 9999, customDomain: true, removeBranding: true },
    });
    expect(getPlan('free').service).toEqual({
      prioritySupport: false,
      dedicatedSupport: false,
      slaGuarantee: false,
    });
    expect(getPlan('plus').service).toEqual({
      prioritySupport: false,
      dedicatedSupport: false,
      slaGuarantee: false,
    });
    expect(getPlan('business').service).toEqual({
      prioritySupport: true,
      dedicatedSupport: false,
      slaGuarantee: false,
    });
    expect(getPlan('enterprise').service).toEqual({
      prioritySupport: true,
      dedicatedSupport: true,
      slaGuarantee: true,
    });
  });
});

describe('pre-launch subscriptions', () => {
  it('keeps billing paid Growth on Plus and Pro on Business at every volume', () => {
    for (const events of EVENT_STEPS.slice(1)) {
      expect(planForLookupKey(`growth_${events}_events`)).toEqual({
        plan: getPlan('plus'),
        events,
        interval: 'month',
      });
    }
    for (const events of EVENT_STEPS) {
      expect(planForLookupKey(`professional_${events}_events`)).toEqual({
        plan: getPlan('business'),
        events,
        interval: 'month',
      });
    }
  });

  it('keeps free Growth accounts on their old site and member limits, with everything new Free has', () => {
    const growth = getPlan('growth');
    expect(growth).toMatchObject({ name: 'Free', listed: false });
    expect(isFreePlan(growth)).toBe(true);
    expect(planForLookupKey('growth_10000_events')).toEqual({ plan: growth, events: 10_000, interval: 'month' });
    expect(growth.capabilities).toEqual({
      dashboards: { maxDashboards: 2, maxMembers: 3 },
      monitoring: { maxMonitors: 1, minIntervalSeconds: 300, ...ALL_CHECKS },
      emailReports: { emailReportsEnabled: false },
      dataRetention: { maxDataRetentionDays: 365 },
      statusPages: { maxStatusPages: 1, customDomain: false, removeBranding: false },
    });
  });
});

describe('purchasing', () => {
  it('only sells listed, self-serve, paid bands', () => {
    expect(purchasableLookupKey('free', 10_000)).toBeNull();
    expect(purchasableLookupKey('growth', 10_000)).toBeNull();
    expect(purchasableLookupKey('plus', 10_000)).toBe('plus_10000_month');
    expect(purchasableLookupKey('business', 50_000)).toBe('business_50000_month');
    expect(purchasableLookupKey('enterprise', 10_000)).toBeNull();
    expect(purchasableLookupKey('plus', 12_345)).toBeNull();
  });

  it('resolves every lookup key a subscription can carry back to its plan and volume', () => {
    for (const plan of ALL_PLANS) {
      for (const band of plan.bands) {
        for (const [interval, lookupKey] of Object.entries(band.lookupKeys)) {
          expect(planForLookupKey(lookupKey)).toEqual({ plan, events: band.events, interval });
        }
      }
      for (const legacy of plan.legacyPrices) {
        expect(planForLookupKey(legacy.lookupKey)).toEqual({
          plan,
          events: legacy.events,
          interval: legacy.interval,
        });
      }
    }
    expect(planForLookupKey('unknown_key')).toBeNull();
  });

  it('never sells a retired price', () => {
    const retired = new Set(ALL_PLANS.flatMap((plan) => plan.legacyPrices.map((legacy) => legacy.lookupKey)));
    for (const plan of ALL_PLANS) {
      for (const events of EVENT_STEPS) {
        const key = purchasableLookupKey(plan.id, events);
        if (key) expect(retired.has(key)).toBe(false);
      }
    }
  });
});

describe('pricing card offers', () => {
  it('keeps Free at its own allowance whatever the slider volume', () => {
    expect(offerFor(getPlan('free'), 500_000, 'USD')).toEqual({ kind: 'free', events: 10_000 });
    expect(offerFor(getPlan('free'), VOLUME_STOPS.at(-1)!, 'EUR')).toEqual({ kind: 'free', events: 10_000 });
  });

  it('prices paid plans at the slider volume and quotes past the largest step', () => {
    expect(offerFor(getPlan('plus'), 10_000, 'EUR')).toEqual({ kind: 'paid', events: 10_000, cents: 900 });
    expect(offerFor(getPlan('business'), 1_000_000, 'USD')).toEqual({
      kind: 'paid',
      events: 1_000_000,
      cents: 10400,
    });
    expect(offerFor(getPlan('plus'), VOLUME_STOPS.at(-1)!, 'USD')).toEqual({
      kind: 'quoted',
      events: VOLUME_STOPS.at(-1),
    });
  });

  it('always quotes Enterprise', () => {
    expect(offerFor(getPlan('enterprise'), 10_000, 'USD')).toEqual({ kind: 'quoted', events: 10_000 });
  });
});

describe('entitlement', () => {
  it('grants the plan on record only while the subscription is in good standing', () => {
    expect(entitledPlan({ planId: 'business', status: 'active' }).id).toBe('business');
    expect(entitledPlan({ planId: 'business', status: 'trialing' }).id).toBe('business');
    expect(entitledPlan({ planId: 'business', status: 'past_due' }).id).toBe('free');
    expect(entitledPlan({ planId: 'business', status: 'canceled' }).id).toBe('free');
  });

  it('names the cheapest listed plan that unlocks a capability', () => {
    expect(planThatUnlocks((c) => c.emailReports.emailReportsEnabled)?.id).toBe('plus');
    expect(planThatUnlocks((c) => c.statusPages.removeBranding)?.id).toBe('business');
    expect(planThatUnlocks((c) => c.dashboards.maxDashboards > 25)?.id).toBe('enterprise');
    expect(planThatUnlocks((c) => c.dashboards.maxDashboards > 10_000)).toBeNull();
  });

  it('only names an upgrade when the current capabilities fall short', () => {
    const hasReports = (c: { emailReports: { emailReportsEnabled: boolean } }) =>
      c.emailReports.emailReportsEnabled;
    expect(upgradeFor(getPlan('growth').capabilities, hasReports)?.id).toBe('plus');
    expect(upgradeFor(getPlan('plus').capabilities, hasReports)).toBeNull();
  });

  it('gives self-hosted deploys every capability', () => {
    expect(selfHostedPlan().id).toBe('enterprise');
  });
});
