import { UNLIMITED_COUNT } from '@/lib/billing/capabilities';
import type { PlanDefinition, PlanHighlight, PlanId, PriceBand } from './types';

export const EVENT_STEPS = [
  10_000, 50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000,
] as const;

/** Slider stop past the largest step, where volume is quoted rather than bought. */
export const CUSTOM_VOLUME = 10_000_001;

function legacyMonthlyBands(planId: PlanId, prices: ReadonlyArray<readonly [number, number, number]>): PriceBand[] {
  return prices.map(([events, usd, eur]) => ({
    events,
    prices: { month: { USD: usd, EUR: eur } },
    lookupKeys: { month: `${planId}_${events}_events` },
  }));
}

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

const feature = (key: Extract<PlanHighlight, { kind: 'feature' }>['key']): PlanHighlight => ({
  kind: 'feature',
  key,
});

const growth: PlanDefinition = {
  id: 'growth',
  name: 'Growth',
  shortName: 'Growth',
  listed: true,
  selfServe: true,
  rank: 1,
  featured: false,
  bands: legacyMonthlyBands('growth', [
    [10_000, 0, 0],
    [50_000, 700, 600],
    [100_000, 1400, 1200],
    [200_000, 2500, 2200],
    [500_000, 3900, 3400],
    [1_000_000, 5900, 5100],
    [2_000_000, 8900, 7700],
    [5_000_000, 12900, 12000],
    [10_000_000, 16900, 14700],
  ]),
  legacyPrices: [],
  capabilities: {
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

const professional: PlanDefinition = {
  id: 'professional',
  name: 'Professional',
  shortName: 'Pro',
  listed: true,
  selfServe: true,
  rank: 2,
  featured: true,
  bands: legacyMonthlyBands('professional', [
    [10_000, 700, 600],
    [50_000, 1100, 1000],
    [100_000, 2100, 1800],
    [200_000, 3800, 3300],
    [500_000, 5900, 5200],
    [1_000_000, 8900, 7700],
    [2_000_000, 13400, 11600],
    [5_000_000, 19400, 16900],
    [10_000_000, 25400, 22100],
  ]),
  legacyPrices: [],
  capabilities: {
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
  },
  service: { prioritySupport: true, dedicatedSupport: false, slaGuarantee: false },
  highlights: [
    { kind: 'everythingIn', planId: 'growth' },
    { kind: 'sites' },
    { kind: 'members' },
    { kind: 'retention' },
    { kind: 'uptime' },
    feature('statusPagesPro'),
    feature('emailReports'),
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
    { kind: 'everythingIn', planId: 'professional' },
    { kind: 'sites' },
    { kind: 'members' },
    { kind: 'retention' },
    { kind: 'uptime' },
    feature('customEventVolume'),
    feature('dedicatedSupport'),
    feature('slaGuarantee'),
  ],
};

const free: PlanDefinition = {
  id: 'free',
  name: 'Free',
  shortName: 'Free',
  listed: false,
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

const plus: PlanDefinition = {
  id: 'plus',
  name: 'Plus',
  shortName: 'Plus',
  listed: false,
  selfServe: true,
  rank: 2,
  featured: true,
  bands: monthlyBands('plus', [9, 14, 19, 29, 49, 69, 89, 129, 169]),
  legacyPrices: [],
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
  listed: false,
  selfServe: true,
  rank: 3,
  featured: false,
  bands: monthlyBands('business', [19, 24, 29, 44, 74, 104, 134, 194, 254]),
  legacyPrices: [],
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
    { kind: 'sites' },
    { kind: 'members' },
    { kind: 'retention' },
    { kind: 'uptime' },
    feature('statusPagesPro'),
    feature('prioritySupport'),
  ],
};

export const PLANS: Readonly<Record<PlanId, PlanDefinition>> = {
  growth,
  professional,
  enterprise,
  free,
  plus,
  business,
};

/** Plan new accounts start on, and accounts return to when a paid subscription lapses, is canceled or is past due. */
export const FREE_PLAN_ID: PlanId = 'growth';

/** Plan whose capabilities self-hosted deploys (billing off) get. */
export const SELF_HOSTED_PLAN_ID: PlanId = 'enterprise';
