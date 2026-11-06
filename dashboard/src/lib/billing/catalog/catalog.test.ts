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
  listedPlans,
  planForLookupKey,
  planThatUnlocks,
  priceFor,
  purchasableLookupKey,
  selfHostedPlan,
  upgradeFor,
} from '@/lib/billing/catalog';
import { PLANS } from './plans';

const ALL_PLANS = Object.values(PLANS);

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

  it('gives every listed self-serve plan a price at every slider step, rising with volume', () => {
    for (const plan of listedPlans().filter((p) => p.selfServe)) {
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

describe('purchasing', () => {
  it('only sells listed, self-serve, paid bands', () => {
    expect(purchasableLookupKey('growth', 10_000)).toBeNull();
    expect(purchasableLookupKey('growth', 50_000)).toBe('growth_50000_events');
    expect(purchasableLookupKey('professional', 10_000)).toBe('professional_10000_events');
    expect(purchasableLookupKey('enterprise', 10_000)).toBeNull();
    expect(purchasableLookupKey('professional', 12_345)).toBeNull();
  });

  it('resolves every lookup key a subscription can carry back to its plan and volume', () => {
    for (const plan of ALL_PLANS) {
      for (const band of plan.bands) {
        for (const [interval, lookupKey] of Object.entries(band.lookupKeys)) {
          expect(planForLookupKey(lookupKey)).toEqual({ plan, events: band.events, interval });
        }
      }
      for (const legacy of plan.legacyPrices) {
        expect(planForLookupKey(legacy.lookupKey)).toEqual({ plan, events: legacy.events, interval: legacy.interval });
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

describe('entitlement', () => {
  it('grants the plan on record only while the subscription is in good standing', () => {
    expect(entitledPlan({ planId: 'professional', status: 'active' }).id).toBe('professional');
    expect(entitledPlan({ planId: 'professional', status: 'trialing' }).id).toBe('professional');
    expect(entitledPlan({ planId: 'professional', status: 'past_due' }).id).toBe(freePlan().id);
    expect(entitledPlan({ planId: 'professional', status: 'canceled' }).id).toBe(freePlan().id);
  });

  it('names the cheapest listed plan that unlocks a capability', () => {
    expect(planThatUnlocks((c) => c.monitoring.customHeaders)?.id).toBe('professional');
    expect(planThatUnlocks((c) => c.dashboards.maxDashboards > 50)?.id).toBe('enterprise');
    expect(planThatUnlocks((c) => c.dashboards.maxDashboards > 10_000)).toBeNull();
  });

  it('only names an upgrade when the current capabilities fall short', () => {
    const growth = getPlan('growth').capabilities;
    expect(upgradeFor(growth, (c) => c.monitoring.customHeaders)?.id).toBe('professional');
    expect(upgradeFor(getPlan('professional').capabilities, (c) => c.monitoring.customHeaders)).toBeNull();
  });

  it('gives self-hosted deploys every capability', () => {
    expect(selfHostedPlan().id).toBe('enterprise');
  });
});

describe('parity with the pre-catalog plans', () => {
  const PRICES_USD_EUR = {
    growth: [
      [10_000, 0, 0],
      [50_000, 700, 600],
      [100_000, 1400, 1200],
      [200_000, 2500, 2200],
      [500_000, 3900, 3400],
      [1_000_000, 5900, 5100],
      [2_000_000, 8900, 7700],
      [5_000_000, 12900, 12000],
      [10_000_000, 16900, 14700],
    ],
    professional: [
      [10_000, 700, 600],
      [50_000, 1100, 1000],
      [100_000, 2100, 1800],
      [200_000, 3800, 3300],
      [500_000, 5900, 5200],
      [1_000_000, 8900, 7700],
      [2_000_000, 13400, 11600],
      [5_000_000, 19400, 16900],
      [10_000_000, 25400, 22100],
    ],
  } as const;

  it.each(Object.entries(PRICES_USD_EUR))('keeps every %s price and lookup key', (planId, rows) => {
    const plan = getPlan(planId as keyof typeof PRICES_USD_EUR);
    for (const [events, usd, eur] of rows) {
      expect(priceFor(plan, events, 'USD')).toBe(usd);
      expect(priceFor(plan, events, 'EUR')).toBe(eur);
      expect(bandFor(plan, events)?.lookupKeys.month).toBe(`${planId}_${events}_events`);
    }
  });

  it('keeps every plan limit', () => {
    expect(getPlan('growth').capabilities).toEqual({
      dashboards: { maxDashboards: 2, maxMembers: 3 },
      monitoring: {
        maxMonitors: 1,
        minIntervalSeconds: 300,
        httpMethodConfigurable: false,
        customStatusCodes: false,
        customHeaders: false,
        keywordValidation: false,
      },
      emailReports: { emailReportsEnabled: false },
      dataRetention: { maxDataRetentionDays: 365 },
      statusPages: { maxStatusPages: 1, customDomain: false, removeBranding: false },
    });
    expect(getPlan('professional').capabilities).toEqual({
      dashboards: { maxDashboards: 50, maxMembers: 50 },
      monitoring: {
        maxMonitors: 50,
        minIntervalSeconds: 60,
        httpMethodConfigurable: true,
        customStatusCodes: true,
        customHeaders: true,
        keywordValidation: true,
      },
      emailReports: { emailReportsEnabled: true },
      dataRetention: { maxDataRetentionDays: 1095 },
      statusPages: { maxStatusPages: 3, customDomain: true, removeBranding: true },
    });
    expect(getPlan('enterprise').capabilities).toEqual({
      dashboards: { maxDashboards: 9999, maxMembers: 9999 },
      monitoring: {
        maxMonitors: 9999,
        minIntervalSeconds: 60,
        httpMethodConfigurable: true,
        customStatusCodes: true,
        customHeaders: true,
        keywordValidation: true,
      },
      emailReports: { emailReportsEnabled: true },
      dataRetention: { maxDataRetentionDays: 1825 },
      statusPages: { maxStatusPages: 9999, customDomain: true, removeBranding: true },
    });
  });

  it('lists exactly the plans on sale today', () => {
    expect(listedPlans().map((plan) => plan.id)).toEqual(['growth', 'professional', 'enterprise']);
  });

  it('keeps the free plan at 10k events with Growth limits', () => {
    expect(freeSubscriptionDefaults()).toEqual({
      planId: 'growth',
      eventLimit: 10_000,
      pricePerMonth: 0,
      currency: 'USD',
      status: 'active',
      cancelAtPeriodEnd: false,
    });
  });
});

describe('the agreed Free, Plus and Business plans', () => {
  const DOLLARS = {
    plus: [9, 14, 19, 29, 49, 69, 89, 129, 169],
    business: [19, 24, 29, 44, 74, 104, 134, 194, 254],
  } as const;

  it.each(Object.entries(DOLLARS))('prices %s at every step, with EUR equal to USD', (planId, dollars) => {
    const plan = getPlan(planId as keyof typeof DOLLARS);
    EVENT_STEPS.forEach((events, index) => {
      expect(priceFor(plan, events, 'USD')).toBe(dollars[index] * 100);
      expect(priceFor(plan, events, 'EUR')).toBe(dollars[index] * 100);
      expect(bandFor(plan, events)?.lookupKeys.month).toBe(`${planId}_${events}_month`);
    });
  });

  it('keeps Free at one zero-priced band of 10k events', () => {
    const free = getPlan('free');
    expect(free.bands).toHaveLength(1);
    expect(isFreeBand(free, 10_000)).toBe(true);
  });

  it('gives each new plan exactly the agreed limits and service', () => {
    const allChecks = {
      httpMethodConfigurable: true,
      customStatusCodes: true,
      customHeaders: true,
      keywordValidation: true,
    };
    expect(getPlan('free').capabilities).toEqual({
      dashboards: { maxDashboards: 1, maxMembers: 1 },
      monitoring: { maxMonitors: 1, minIntervalSeconds: 300, ...allChecks },
      emailReports: { emailReportsEnabled: false },
      dataRetention: { maxDataRetentionDays: 365 },
      statusPages: { maxStatusPages: 1, customDomain: false, removeBranding: false },
    });
    expect(getPlan('plus').capabilities).toEqual({
      dashboards: { maxDashboards: 5, maxMembers: 3 },
      monitoring: { maxMonitors: 5, minIntervalSeconds: 60, ...allChecks },
      emailReports: { emailReportsEnabled: true },
      dataRetention: { maxDataRetentionDays: 730 },
      statusPages: { maxStatusPages: 1, customDomain: true, removeBranding: false },
    });
    expect(getPlan('business').capabilities).toEqual({
      dashboards: { maxDashboards: 25, maxMembers: 25 },
      monitoring: { maxMonitors: 50, minIntervalSeconds: 60, ...allChecks },
      emailReports: { emailReportsEnabled: true },
      dataRetention: { maxDataRetentionDays: 1095 },
      statusPages: { maxStatusPages: 3, customDomain: true, removeBranding: true },
    });
    expect(getPlan('free').service).toEqual({ prioritySupport: false, dedicatedSupport: false, slaGuarantee: false });
    expect(getPlan('plus').service).toEqual({ prioritySupport: false, dedicatedSupport: false, slaGuarantee: false });
    expect(getPlan('business').service).toEqual({ prioritySupport: true, dedicatedSupport: false, slaGuarantee: false });
  });

  it('keeps the new plans unlisted and off sale', () => {
    for (const planId of ['free', 'plus', 'business'] as const) {
      expect(getPlan(planId).listed).toBe(false);
      for (const events of EVENT_STEPS) {
        expect(purchasableLookupKey(planId, events)).toBeNull();
      }
    }
  });
});
