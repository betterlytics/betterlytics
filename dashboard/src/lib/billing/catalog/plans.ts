import { UNLIMITED_COUNT } from '@/lib/billing/capabilities';
import type { LegacyPrice, PlanDefinition, PlanHighlight, PlanId, PriceBand } from './types';

export const EVENT_STEPS = [
  10_000, 50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000,
] as const;

/** Slider stop past the largest step, where volume is quoted rather than bought. */
export const CUSTOM_VOLUME = 10_000_001;

function monthlyBands(planId: PlanId, dollars: readonly number[]): PriceBand[] {
  return EVENT_STEPS.map((events, index) => {
    const cents = dollars[index] * 100;
    return {
      events,
      prices: { month: { USD: cents, EUR: cents } },
      lookupKeys: { month: `${planId}_${events}_month` },
    };
  });
}

/** Prices of the plans sold before November 2026, still billing the subscriptions moved onto their successors. */
function retiredMonthlyPrices(retiredPlan: 'growth' | 'professional', steps: readonly number[]): LegacyPrice[] {
  return steps.map((events) => ({ lookupKey: `${retiredPlan}_${events}_events`, events, interval: 'month' }));
}

const feature = (key: Extract<PlanHighlight, { kind: 'feature' }>['key']): PlanHighlight => ({
  kind: 'feature',
  key,
});

const free: PlanDefinition = {
  id: 'free',
  name: 'Free',
  shortName: 'Free',
  listed: true,
  selfServe: true,
  rank: 1,
  featured: false,
  bands: [{ events: 10_000, prices: { month: { USD: 0, EUR: 0 } }, lookupKeys: {} }],
  legacyPrices: [],
  capabilities: {
    dashboards: { maxDashboards: 1, maxMembers: 1 },
    monitoring: {
      maxMonitors: 1,
      minIntervalSeconds: 300,
      httpMethodConfigurable: true,
      customStatusCodes: true,
      customHeaders: true,
      keywordValidation: true,
    },
    emailReports: { emailReportsEnabled: false },
    dataRetention: { maxDataRetentionDays: 365 },
    statusPages: { maxStatusPages: 1, customDomain: false, removeBranding: false },
  },
  service: { prioritySupport: false, dedicatedSupport: false, slaGuarantee: false },
  highlights: [
    { kind: 'events' },
    { kind: 'sites' },
    { kind: 'members' },
    { kind: 'retention' },
    { kind: 'uptime' },
    { kind: 'statusPages' },
    feature('fullDashboard'),
    feature('funnelsJourneys'),
    feature('sessionReplay'),
    feature('errorTracking'),
  ],
};

/** Free as it was before November 2026. Accounts that joined then keep its 2 sites and 3 members per site. */
const growth: PlanDefinition = {
  ...free,
  id: 'growth',
  listed: false,
  bands: [{ events: 10_000, prices: { month: { USD: 0, EUR: 0 } }, lookupKeys: { month: 'growth_10000_events' } }],
  capabilities: { ...free.capabilities, dashboards: { maxDashboards: 2, maxMembers: 3 } },
};

const plus: PlanDefinition = {
  id: 'plus',
  name: 'Plus',
  shortName: 'Plus',
  listed: true,
  selfServe: true,
  rank: 2,
  featured: true,
  bands: monthlyBands('plus', [9, 14, 19, 29, 49, 69, 89, 129, 169]),
  // Growth's free 10k step stays with the grandfathered plan above
  legacyPrices: retiredMonthlyPrices('growth', EVENT_STEPS.slice(1)),
  capabilities: {
    dashboards: { maxDashboards: 5, maxMembers: 3 },
    monitoring: {
      maxMonitors: 5,
      minIntervalSeconds: 60,
      httpMethodConfigurable: true,
      customStatusCodes: true,
      customHeaders: true,
      keywordValidation: true,
    },
    emailReports: { emailReportsEnabled: true },
    dataRetention: { maxDataRetentionDays: 730 },
    statusPages: { maxStatusPages: 1, customDomain: true, removeBranding: false },
  },
  service: { prioritySupport: false, dedicatedSupport: false, slaGuarantee: false },
  highlights: [
    { kind: 'everythingIn', planId: 'free' },
    { kind: 'events' },
    { kind: 'sites' },
    { kind: 'members' },
    { kind: 'retention' },
    { kind: 'uptime' },
    feature('emailReports'),
    feature('statusPageCustomDomain'),
  ],
};

const business: PlanDefinition = {
  id: 'business',
  name: 'Business',
  shortName: 'Business',
  listed: true,
  selfServe: true,
  rank: 3,
  featured: false,
  bands: monthlyBands('business', [19, 24, 29, 44, 74, 104, 134, 194, 254]),
  legacyPrices: retiredMonthlyPrices('professional', EVENT_STEPS),
  capabilities: {
    dashboards: { maxDashboards: 25, maxMembers: 25 },
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
  },
  service: { prioritySupport: true, dedicatedSupport: false, slaGuarantee: false },
  highlights: [
    { kind: 'everythingIn', planId: 'plus' },
    { kind: 'events' },
    { kind: 'sites' },
    { kind: 'members' },
    { kind: 'retention' },
    { kind: 'uptime' },
    feature('statusPagesPro'),
    feature('prioritySupport'),
  ],
};

const enterprise: PlanDefinition = {
  id: 'enterprise',
  name: 'Enterprise',
  shortName: 'Enterprise',
  listed: true,
  selfServe: false,
  rank: 4,
  featured: false,
  bands: [],
  legacyPrices: [],
  capabilities: {
    dashboards: { maxDashboards: UNLIMITED_COUNT, maxMembers: UNLIMITED_COUNT },
    monitoring: {
      maxMonitors: UNLIMITED_COUNT,
      minIntervalSeconds: 60,
      httpMethodConfigurable: true,
      customStatusCodes: true,
      customHeaders: true,
      keywordValidation: true,
    },
    emailReports: { emailReportsEnabled: true },
    dataRetention: { maxDataRetentionDays: 1825 },
    statusPages: { maxStatusPages: UNLIMITED_COUNT, customDomain: true, removeBranding: true },
  },
  service: { prioritySupport: true, dedicatedSupport: true, slaGuarantee: true },
  highlights: [
    { kind: 'everythingIn', planId: 'business' },
    { kind: 'eventsAboveSlider' },
    { kind: 'sites' },
    { kind: 'members' },
    feature('samlSso'),
    feature('auditLog'),
    feature('slaGuarantee'),
    feature('dpaSecurityReviews'),
    feature('customRetention'),
    feature('customContracts'),
  ],
};

export const PLANS: Readonly<Record<PlanId, PlanDefinition>> = {
  free,
  plus,
  business,
  enterprise,
  growth,
};

/** Plan new accounts start on, and accounts return to when a paid subscription lapses, is canceled or is past due. */
export const FREE_PLAN_ID: PlanId = 'free';

/** Plan whose capabilities self-hosted deploys (billing off) get. */
export const SELF_HOSTED_PLAN_ID: PlanId = 'enterprise';
