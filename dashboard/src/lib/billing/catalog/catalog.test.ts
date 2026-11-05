import { describe, expect, it } from 'vitest';
import { Currency } from '@prisma/client';
import {
  EVENT_STEPS,
  PLAN_CURRENCIES,
  PLAN_IDS,
  VOLUME_STOPS,
  bandFor,
  currentPlanId,
  entitledPlan,
  fitsVolume,
  freePlan,
  freeSubscriptionDefaults,
  getPlan,
  isCurrentOffer,
  isFreeBand,
  isFreePlan,
  listedPlans,
  offerFor,
  planForLookupKey,
  planThatUnlocks,
  priceFor,
  purchasableLookupKey,
  recommendedPlanFor,
  selfHostedPlan,
  upgradeFor,
} from '@/lib/billing/catalog';
import { UNLIMITED_COUNT } from '@/lib/billing/capabilities';
import { PLANS } from './plans';

const ALL_PLANS = Object.values(PLANS);

const ALL_CHECKS = {
  httpMethodConfigurable: true,
  customStatusCodes: true,
  customHeaders: true,
  keywordValidation: true,
};

const NO_CHECKS = {
  httpMethodConfigurable: false,
  customStatusCodes: false,
  customHeaders: false,
  keywordValidation: false,
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
      expect(bandFor(plan, events)?.lookupKeys.month).toBe(`${planId}_202611_${events}_month`);
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
      monitoring: { maxMonitors: 1, minIntervalSeconds: 300, ...NO_CHECKS },
      emailReports: { emailReportsEnabled: false },
      dataRetention: { maxDataRetentionDays: 365 },
      statusPages: { maxStatusPages: 1, customDomain: false, removeBranding: false },
      sessionReplay: { maxReplaysPerMonth: 500 },
    });
    expect(getPlan('plus').capabilities).toEqual({
      dashboards: { maxDashboards: 5, maxMembers: 3 },
      monitoring: { maxMonitors: 5, minIntervalSeconds: 60, ...ALL_CHECKS },
      emailReports: { emailReportsEnabled: true },
      dataRetention: { maxDataRetentionDays: 730 },
      statusPages: { maxStatusPages: 1, customDomain: true, removeBranding: false },
      sessionReplay: { maxReplaysPerMonth: 5_000 },
    });
    expect(getPlan('business').capabilities).toEqual({
      dashboards: { maxDashboards: 25, maxMembers: 25 },
      monitoring: { maxMonitors: 50, minIntervalSeconds: 60, ...ALL_CHECKS },
      emailReports: { emailReportsEnabled: true },
      dataRetention: { maxDataRetentionDays: 1095 },
      statusPages: { maxStatusPages: 3, customDomain: true, removeBranding: true },
      sessionReplay: { maxReplaysPerMonth: 25_000 },
    });
    expect(getPlan('enterprise').capabilities).toEqual({
      dashboards: { maxDashboards: UNLIMITED_COUNT, maxMembers: UNLIMITED_COUNT },
      monitoring: { maxMonitors: UNLIMITED_COUNT, minIntervalSeconds: 60, ...ALL_CHECKS },
      emailReports: { emailReportsEnabled: true },
      dataRetention: { maxDataRetentionDays: 1825 },
      statusPages: { maxStatusPages: UNLIMITED_COUNT, customDomain: true, removeBranding: true },
      sessionReplay: { maxReplaysPerMonth: UNLIMITED_COUNT },
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
      monitoring: { maxMonitors: 1, minIntervalSeconds: 300, ...NO_CHECKS },
      emailReports: { emailReportsEnabled: false },
      dataRetention: { maxDataRetentionDays: 365 },
      statusPages: { maxStatusPages: 1, customDomain: false, removeBranding: false },
      sessionReplay: { maxReplaysPerMonth: 500 },
    });
  });
});

describe('plan ids renamed at launch', () => {
  it('reads a Pro id written by an older deploy as Business', () => {
    expect(currentPlanId('professional')).toBe('business');
  });

  it('leaves every current id alone', () => {
    for (const id of PLAN_IDS) {
      expect(currentPlanId(id)).toBe(id);
    }
  });
});

describe('purchasing', () => {
  it('only sells listed, self-serve, paid bands', () => {
    expect(purchasableLookupKey('free', 10_000)).toBeNull();
    expect(purchasableLookupKey('growth', 10_000)).toBeNull();
    expect(purchasableLookupKey('plus', 10_000)).toBe('plus_202611_10000_month');
    expect(purchasableLookupKey('business', 50_000)).toBe('business_202611_50000_month');
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

  it('prices paid plans at the slider volume, and at their largest step past it', () => {
    expect(offerFor(getPlan('plus'), 10_000, 'EUR')).toEqual({ kind: 'paid', events: 10_000, cents: 900 });
    expect(offerFor(getPlan('business'), 1_000_000, 'USD')).toEqual({
      kind: 'paid',
      events: 1_000_000,
      cents: 10400,
    });
    expect(offerFor(getPlan('plus'), VOLUME_STOPS.at(-1)!, 'USD')).toEqual({
      kind: 'paid',
      events: 10_000_000,
      cents: 16900,
    });
  });

  it('always quotes Enterprise', () => {
    expect(offerFor(getPlan('enterprise'), 10_000, 'USD')).toEqual({ kind: 'quoted', events: 10_000 });
  });
});

describe('plans that fit a slider volume', () => {
  const fitting = (events: number) =>
    listedPlans()
      .filter((plan) => fitsVolume(plan, events))
      .map((plan) => plan.id);

  it('fits Free within its allowance, paid plans up to the largest step and Enterprise at any volume', () => {
    expect(fitting(10_000)).toEqual(['free', 'plus', 'business', 'enterprise']);
    expect(fitting(50_000)).toEqual(['plus', 'business', 'enterprise']);
    expect(fitting(EVENT_STEPS.at(-1)!)).toEqual(['plus', 'business', 'enterprise']);
    expect(fitting(VOLUME_STOPS.at(-1)!)).toEqual(['enterprise']);
  });

  it('recommends Plus while it fits, then Enterprise', () => {
    expect(recommendedPlanFor(10_000)?.id).toBe('plus');
    expect(recommendedPlanFor(EVENT_STEPS.at(-1)!)?.id).toBe('plus');
    expect(recommendedPlanFor(VOLUME_STOPS.at(-1)!)?.id).toBe('enterprise');
  });
});

describe('current plan card', () => {
  const card = (planId: 'free' | 'plus' | 'business' | 'enterprise', events: number, currency: 'USD' | 'EUR') => {
    const plan = getPlan(planId);
    return [plan, offerFor(plan, events, currency), currency] as const;
  };

  it('marks the card an account is on at today’s price', () => {
    const subscription = {
      planId: 'plus' as const,
      eventLimit: 50_000,
      pricePerMonth: 1400,
      currency: 'USD' as const,
    };
    expect(isCurrentOffer(subscription, ...card('plus', 50_000, 'USD'))).toBe(true);
    expect(isCurrentOffer(subscription, ...card('plus', 100_000, 'USD'))).toBe(false);
    expect(isCurrentOffer(subscription, ...card('business', 50_000, 'USD'))).toBe(false);
  });

  it('marks no paid card for a retired price, since it is no longer sold', () => {
    const exPro = {
      planId: 'business' as const,
      eventLimit: 10_000,
      pricePerMonth: 600,
      currency: 'EUR' as const,
    };
    expect(isCurrentOffer(exPro, ...card('business', 10_000, 'EUR'))).toBe(false);
  });

  it('marks the Free card for both the new and the older free plan, and never Enterprise', () => {
    const free = { planId: 'free' as const, eventLimit: 10_000, pricePerMonth: 0, currency: 'USD' as const };
    expect(isCurrentOffer(free, ...card('free', 500_000, 'USD'))).toBe(true);
    expect(isCurrentOffer({ ...free, planId: 'growth' }, ...card('free', 10_000, 'USD'))).toBe(true);
    expect(isCurrentOffer({ ...free, planId: 'enterprise' }, ...card('enterprise', 10_000, 'USD'))).toBe(false);
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
    expect(planThatUnlocks((c) => c.monitoring.keywordValidation)?.id).toBe('plus');
    expect(planThatUnlocks((c) => c.statusPages.removeBranding)?.id).toBe('business');
    expect(planThatUnlocks((c) => c.dashboards.maxDashboards > 25)?.id).toBe('enterprise');
    expect(planThatUnlocks((c) => c.dashboards.maxDashboards > UNLIMITED_COUNT)).toBeNull();
  });

  it('only names an upgrade when the current capabilities fall short', () => {
    const hasReports = (c: { emailReports: { emailReportsEnabled: boolean } }) =>
      c.emailReports.emailReportsEnabled;
    expect(upgradeFor(getPlan('growth').capabilities, hasReports)?.id).toBe('plus');
    expect(upgradeFor(getPlan('plus').capabilities, hasReports)).toBeNull();
  });

  it('gives self-hosted deploys at least the limits of every listed plan', () => {
    const selfHosted = selfHostedPlan().capabilities;
    for (const { capabilities: plan } of listedPlans()) {
      expect(selfHosted.dashboards.maxDashboards).toBeGreaterThanOrEqual(plan.dashboards.maxDashboards);
      expect(selfHosted.dashboards.maxMembers).toBeGreaterThanOrEqual(plan.dashboards.maxMembers);
      expect(selfHosted.monitoring.maxMonitors).toBeGreaterThanOrEqual(plan.monitoring.maxMonitors);
      expect(selfHosted.monitoring.minIntervalSeconds).toBeLessThanOrEqual(plan.monitoring.minIntervalSeconds);
      expect(selfHosted.dataRetention.maxDataRetentionDays).toBeGreaterThanOrEqual(
        plan.dataRetention.maxDataRetentionDays,
      );
      expect(selfHosted.statusPages.maxStatusPages).toBeGreaterThanOrEqual(plan.statusPages.maxStatusPages);
      expect(selfHosted.sessionReplay.maxReplaysPerMonth).toBeGreaterThanOrEqual(
        plan.sessionReplay.maxReplaysPerMonth,
      );
    }
    expect(Object.values(selfHosted.monitoring).every((value) => value !== false)).toBe(true);
    expect(selfHosted.emailReports.emailReportsEnabled).toBe(true);
    expect(selfHosted.statusPages).toMatchObject({ customDomain: true, removeBranding: true });
  });
});
