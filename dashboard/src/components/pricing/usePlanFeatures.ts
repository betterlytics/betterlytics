import { useCallback, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  EVENT_STEPS,
  fitsVolume,
  getPlan,
  listedPlans,
  offerFor,
  recommendedPlanFor,
  type PlanCurrency,
  type PlanDefinition,
  type PlanOffer,
} from '@/lib/billing/catalog';
import { checkIntervalMinutes, isUnlimitedCount, retentionYears } from '@/lib/billing/capabilities';
import { formatEventCount } from '@/utils/pricing';

export type PlanFeatureLabel = { kind: 'header' | 'feature'; label: string };

export function usePlanFeatures() {
  const t = useTranslations('pricingCards');

  return useCallback(
    (plan: PlanDefinition): PlanFeatureLabel[] => {
      const { dashboards, dataRetention, monitoring, statusPages, sessionReplay } = plan.capabilities;
      return plan.highlights.map((item): PlanFeatureLabel => {
        switch (item.kind) {
          case 'everythingIn':
            return { kind: 'header', label: t('features.everythingIn', { name: getPlan(item.planId).name }) };
          case 'sites':
            return {
              kind: 'feature',
              label: isUnlimitedCount(dashboards.maxDashboards)
                ? t('features.unlimitedSites')
                : t('features.sitesCount', { count: dashboards.maxDashboards }),
            };
          case 'members':
            return {
              kind: 'feature',
              label: isUnlimitedCount(dashboards.maxMembers)
                ? t('features.unlimitedTeamMembers')
                : t('features.teamMembersCount', { count: dashboards.maxMembers }),
            };
          case 'retention':
            return {
              kind: 'feature',
              label: t('features.retentionYears', { count: retentionYears(dataRetention.maxDataRetentionDays) }),
            };
          case 'uptime':
            return {
              kind: 'feature',
              label: isUnlimitedCount(monitoring.maxMonitors)
                ? t('features.uptimeUnlimited')
                : t('features.uptimeMonitors', {
                    count: monitoring.maxMonitors,
                    minutes: checkIntervalMinutes(monitoring.minIntervalSeconds),
                  }),
            };
          case 'statusPages':
            return {
              kind: 'feature',
              label: t('features.statusPagesCount', { count: statusPages.maxStatusPages }),
            };
          case 'replays':
            return {
              kind: 'feature',
              label: t('features.replaysPerMonth', { count: sessionReplay.maxReplaysPerMonth }),
            };
          case 'feature':
            return { kind: 'feature', label: t(`features.${item.key}`) };
        }
      });
    },
    [t],
  );
}

export type VolumeLabel = { text: string; figure: string; events: number };

export function useOfferVolumeLabel() {
  const t = useTranslations('pricingCards');
  const locale = useLocale();

  return useCallback(
    (offer: PlanOffer): VolumeLabel => {
      const events = offer.kind === 'quoted' ? EVENT_STEPS[EVENT_STEPS.length - 1] : offer.events;
      const figure = formatEventCount(events, locale);
      const text =
        offer.kind === 'quoted'
          ? t('features.moreThanEventsPerMonth', { events: figure })
          : t('features.eventsPerMonth', { events: figure });
      return { text, figure, events };
    },
    [locale, t],
  );
}

export type PlanCard = {
  plan: PlanDefinition;
  offer: PlanOffer;
  fits: boolean;
  isRecommended: boolean;
  volumeLabel: VolumeLabel;
  features: PlanFeatureLabel[];
};

export function usePlanCards(volume: number, currency: PlanCurrency): PlanCard[] {
  const featuresFor = usePlanFeatures();
  const volumeLabelFor = useOfferVolumeLabel();

  return useMemo(() => {
    const recommended = recommendedPlanFor(volume);
    return listedPlans().map((plan) => {
      const offer = offerFor(plan, volume, currency);
      return {
        plan,
        offer,
        fits: fitsVolume(plan, volume),
        isRecommended: plan.id === recommended?.id,
        volumeLabel: volumeLabelFor(offer),
        features: featuresFor(plan),
      };
    });
  }, [volume, currency, featuresFor, volumeLabelFor]);
}
