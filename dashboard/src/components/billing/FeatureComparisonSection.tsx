'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ComparisonTable } from '@/components/public/comparison-table';
import { EVENT_STEPS, listedPlans, type PlanDefinition } from '@/lib/billing/catalog';
import { formatEventCount } from '@/utils/pricing';
import { isUnlimitedCount } from '@/lib/billing/capabilities';

type ValueMessage = { message: string; count?: number };

type FeatureValue = boolean | ValueMessage | 'eventRange';

interface Feature {
  key: string;
  value: true | ((plan: PlanDefinition) => FeatureValue);
}

interface FeatureCategory {
  key: string;
  features: Feature[];
}

const limit = (message: string, count: number): ValueMessage =>
  isUnlimitedCount(count) ? { message: 'unlimited' } : { message, count };

const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    key: 'usageLimits',
    features: [
      { key: 'monthlyEvents', value: (plan) => (plan.selfServe ? 'eventRange' : { message: 'custom' }) },
      { key: 'sites', value: (plan) => limit('upToCount', plan.capabilities.dashboards.maxDashboards) },
      {
        key: 'dataRetention',
        value: (plan) => ({
          message: 'yearsCount',
          count: Math.floor(plan.capabilities.dataRetention.maxDataRetentionDays / 365),
        }),
      },
      { key: 'teamMembers', value: (plan) => limit('upToCount', plan.capabilities.dashboards.maxMembers) },
    ],
  },
  {
    key: 'analytics',
    features: [
      { key: 'dashboardFeatures', value: true },
      { key: 'funnels', value: true },
      { key: 'userJourneys', value: true },
      { key: 'customEvents', value: true },
      { key: 'webVitals', value: true },
      { key: 'campaignTracking', value: true },
      { key: 'sessionReplay', value: true },
      { key: 'errorTracking', value: true },
      { key: 'emailReports', value: (plan) => plan.capabilities.emailReports.emailReportsEnabled },
    ],
  },
  {
    key: 'observability',
    features: [
      {
        key: 'uptimeMonitoring',
        value: (plan) => limit('monitorsCount', plan.capabilities.monitoring.maxMonitors),
      },
      {
        key: 'checkInterval',
        value: (plan) => ({
          message: 'minutesCount',
          count: plan.capabilities.monitoring.minIntervalSeconds / 60,
        }),
      },
      { key: 'sslMonitoring', value: true },
      { key: 'customHttpMethods', value: (plan) => plan.capabilities.monitoring.httpMethodConfigurable },
      { key: 'customRequestHeaders', value: (plan) => plan.capabilities.monitoring.customHeaders },
      { key: 'customStatusCodes', value: (plan) => plan.capabilities.monitoring.customStatusCodes },
      { key: 'notificationIntegrations', value: true },
      {
        key: 'statusPages',
        value: (plan) => limit('statusPagesCount', plan.capabilities.statusPages.maxStatusPages),
      },
      { key: 'statusPageCustomDomain', value: (plan) => plan.capabilities.statusPages.customDomain },
      { key: 'statusPageWhiteLabel', value: (plan) => plan.capabilities.statusPages.removeBranding },
    ],
  },
  {
    key: 'support',
    features: [
      { key: 'emailSupport', value: true },
      { key: 'prioritySupport', value: (plan) => plan.service.prioritySupport },
      { key: 'dedicatedSupport', value: (plan) => plan.service.dedicatedSupport },
      { key: 'slaGuarantee', value: (plan) => plan.service.slaGuarantee },
    ],
  },
];

export function FeatureComparisonSection() {
  const t = useTranslations('pricingComparison');
  const td = (key: string, values?: { count: number }) => t(key as Parameters<typeof t>[0], values);
  const locale = useLocale();
  const plans = listedPlans();

  const formatEventRange = () => {
    const min = formatEventCount(EVENT_STEPS[0], locale);
    const max = formatEventCount(EVENT_STEPS[EVENT_STEPS.length - 1], locale);
    return `${min} – ${max}+`;
  };

  const formatValue = (featureKey: string, value: FeatureValue) => {
    if (typeof value === 'boolean') return value;
    if (value === 'eventRange') return formatEventRange();
    const { message, count } = value;
    return td(`features.${featureKey}.values.${message}`, count === undefined ? undefined : { count });
  };

  const categories = FEATURE_CATEGORIES.map((category) => ({
    name: td(`categories.${category.key}`),
    features: category.features.map((feature) => ({
      name: td(`features.${feature.key}.name`),
      values: plans.map((plan) => (feature.value === true ? true : formatValue(feature.key, feature.value(plan)))),
    })),
  }));

  const columns = plans.map((plan) => ({
    label: plan.name,
    highlight: plan.featured,
  }));

  return <ComparisonTable categories={categories} columns={columns} featureColumnLabel={t('headers.features')} />;
}
