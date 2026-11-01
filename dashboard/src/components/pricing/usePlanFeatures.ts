import { useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { PlanDefinition } from '@/lib/billing/catalog';
import { formatEventCount } from '@/utils/pricing';

export type PlanFeatureLabel = { kind: 'header' | 'feature'; label: string };

export function usePlanFeatures(volume: number) {
  const t = useTranslations('pricingCards');
  const locale = useLocale();

  return useCallback(
    (plan: PlanDefinition): PlanFeatureLabel[] =>
      plan.highlights.map((item) => {
        switch (item.kind) {
          case 'events':
            return {
              kind: 'feature',
              label: t('features.upToEventsPerMonth', { events: formatEventCount(volume, locale) }),
            };
          case 'header':
            return { kind: 'header', label: t(`features.${item.key}`) };
          case 'feature':
            return { kind: 'feature', label: t(`features.${item.key}`) };
        }
      }),
    [volume, locale, t],
  );
}
