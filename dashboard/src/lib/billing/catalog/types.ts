import type { PlanCapabilities } from '@/lib/billing/capabilities';

export const PLAN_IDS = ['growth', 'professional', 'enterprise'] as const;
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

/** Keys under `pricingCards.features` messages; `events` formats with the selected volume. */
export type PlanHighlight =
  | { kind: 'events' }
  | { kind: 'header'; key: 'everythingInStarter' | 'everythingInProfessional' }
  | {
      kind: 'feature';
      key:
        | 'twoSites'
        | 'upTo50Sites'
        | 'unlimitedSites'
        | 'threeTeamMembers'
        | 'upTo50TeamMembers'
        | 'unlimitedTeamMembers'
        | 'retention1PlusYear'
        | 'retention3PlusYears'
        | 'retention5PlusYears'
        | 'fullDashboard'
        | 'funnelsJourneys'
        | 'sessionReplay'
        | 'errorTracking'
        | 'uptime1'
        | 'uptime50'
        | 'uptimeUnlimited'
        | 'statusPagesPro'
        | 'emailReports'
        | 'customEventVolume'
        | 'dedicatedSupport'
        | 'slaGuarantee';
    };

export type PlanDefinition = {
  id: PlanId;
  /** Brand name, shown untranslated in every locale, emails and Stripe. */
  name: string;
  /** Badge label for features this plan unlocks. */
  shortName: string;
  /** Shown on the pricing page and plan picker. */
  listed: boolean;
  /** Bought through checkout; false means "talk to us". */
  selfServe: boolean;
  /** Order from cheapest to most complete. */
  rank: number;
  /** Highlighted as the recommended plan on pricing surfaces. */
  featured: boolean;
  bands: readonly PriceBand[];
  legacyPrices: readonly LegacyPrice[];
  capabilities: PlanCapabilities;
  service: PlanService;
  highlights: readonly PlanHighlight[];
};
