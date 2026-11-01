import type { PlanCapabilities } from '@/lib/billing/capabilities';

export const PLAN_IDS = ['free', 'plus', 'business', 'enterprise', 'growth'] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const PLAN_CURRENCIES = ['USD', 'EUR'] as const;
export type PlanCurrency = (typeof PLAN_CURRENCIES)[number];

export type BillingInterval = 'month';

/** Amounts in cents, one per supported currency. */
export type BandPrice = Record<PlanCurrency, number>;

export type PriceBand = {
  events: number;
  prices: Partial<Record<BillingInterval, BandPrice>>;
  lookupKeys: Partial<Record<BillingInterval, string>>;
};

/** A retired Stripe price that keeps billing existing subscriptions on this plan but can no longer be bought. */
export type LegacyPrice = {
  lookupKey: string;
  events: number;
  interval: BillingInterval;
};

export type PlanService = {
  prioritySupport: boolean;
  dedicatedSupport: boolean;
  slaGuarantee: boolean;
};

/**
 * A pricing-card line. Limit lines (sites, members, retention, uptime) are worded from the plan's
 * capabilities; `feature` lines are fixed keys under `pricingCards.features`.
 */
export type PlanHighlight =
  | { kind: 'events' }
  | { kind: 'eventsAboveSlider' }
  | { kind: 'everythingIn'; planId: PlanId }
  | { kind: 'sites' }
  | { kind: 'members' }
  | { kind: 'retention' }
  | { kind: 'uptime' }
  | { kind: 'statusPages' }
  | {
      kind: 'feature';
      key:
        | 'fullDashboard'
        | 'funnelsJourneys'
        | 'sessionReplay'
        | 'errorTracking'
        | 'statusPagesPro'
        | 'statusPageCustomDomain'
        | 'prioritySupport'
        | 'emailReports'
        | 'samlSso'
        | 'auditLog'
        | 'slaGuarantee'
        | 'dpaSecurityReviews'
        | 'customRetention'
        | 'customContracts';
    };

export type PlanDefinition = {
  id: PlanId;
  /** Brand name, shown untranslated in every locale, emails and Stripe. */
  name: string;
  shortName: string;
  listed: boolean;
  /** Bought through checkout; false means "talk to us". */
  selfServe: boolean;
  rank: number;
  featured: boolean;
  bands: readonly PriceBand[];
  legacyPrices: readonly LegacyPrice[];
  capabilities: PlanCapabilities;
  service: PlanService;
  highlights: readonly PlanHighlight[];
};
