import { useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getPlan, type PlanDefinition } from '@/lib/billing/catalog';
import { checkIntervalMinutes, isUnlimitedCount, retentionYears } from '@/lib/billing/capabilities';
import { formatEventCount } from '@/utils/pricing';

export type PlanFeatureLabel = { kind: 'header' | 'feature'; label: string };

export function usePlanFeatures(volume: number) {
  const t = useTranslations('pricingCards');
  const locale = useLocale();

  return useCallback(
    (plan: PlanDefinition): PlanFeatureLabel[] => {
      const { dashboards, dataRetention, monitoring, statusPages } = plan.capabilities;
      return plan.highlights.map((item): PlanFeatureLabel => {
        switch (item.kind) {
          case 'events':
            return {
              kind: 'feature',
              label: t('features.upToEventsPerMonth', { events: formatEventCount(volume, locale) }),
            };
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
            return { kind: 'feature', label: t('features.statusPagesCount', { count: statusPages.maxStatusPages }) };
          case 'feature':
            return { kind: 'feature', label: t(`features.${item.key}`) };
        }
      });
    },
    [volume, locale, t],
  );
}
