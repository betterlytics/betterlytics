import type { Tier } from '@/entities/billing/billing.entities';

/**
 * What each plan lists, in display order, as keys under the `pricingCards.features`
 * messages. Every pricing surface renders from this so the plans can't drift apart.
 *
 * `events` is the tier's event allowance (needs the selected range to format);
 * `header` introduces the set inherited from the tier below.
 */
export type PlanFeatureItem =
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

const feature = (key: Extract<PlanFeatureItem, { kind: 'feature' }>['key']): PlanFeatureItem => ({
  kind: 'feature',
  key,
});

export const PLAN_FEATURES: Record<Tier, readonly PlanFeatureItem[]> = {
  growth: [
    { kind: 'events' },
    feature('twoSites'),
    feature('threeTeamMembers'),
    feature('retention1PlusYear'),
    feature('uptime1'),
    feature('fullDashboard'),
    feature('funnelsJourneys'),
    feature('sessionReplay'),
    feature('errorTracking'),
  ],
  professional: [
    { kind: 'header', key: 'everythingInStarter' },
    feature('upTo50Sites'),
    feature('upTo50TeamMembers'),
    feature('retention3PlusYears'),
    feature('uptime50'),
    feature('statusPagesPro'),
    feature('emailReports'),
  ],
  enterprise: [
    { kind: 'header', key: 'everythingInProfessional' },
    feature('unlimitedSites'),
    feature('unlimitedTeamMembers'),
    feature('retention5PlusYears'),
    feature('uptimeUnlimited'),
    feature('customEventVolume'),
    feature('dedicatedSupport'),
    feature('slaGuarantee'),
  ],
};
