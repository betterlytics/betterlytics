import { useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Tier } from '@/entities/billing/billing.entities';
import { PLAN_FEATURES } from '@/lib/billing/planFeatures';
import type { EventRange } from '@/lib/billing/plans';
import { formatEventCount } from '@/utils/pricing';

export type PlanFeatureLabel = { kind: 'header' | 'feature'; label: string };

/** Resolves a tier's feature list to display strings for the selected event range. */
export function usePlanFeatures(eventRange: EventRange) {
  const t = useTranslations('pricingCards');
  const locale = useLocale();

  return useCallback(
    (tier: Tier): PlanFeatureLabel[] =>
      PLAN_FEATURES[tier].map((item) => {
        switch (item.kind) {
          case 'events':
            return {
              kind: 'feature',
              label: t('features.upToEventsPerMonth', { events: formatEventCount(eventRange.value, locale) }),
            };
          case 'header':
            return { kind: 'header', label: t(`features.${item.key}`) };
          case 'feature':
            return { kind: 'feature', label: t(`features.${item.key}`) };
        }
      }),
    [eventRange.value, locale, t],
  );
}
