'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ComparisonTable } from '@/components/public/comparison-table';
import { formatNumber } from '@/utils/formatters';

type FeatureValue = boolean | string | 'partial';

const TIERS = ['growth', 'professional', 'enterprise'] as const;

interface Feature {
  key: string;
  growth: FeatureValue;
  professional: FeatureValue;
  enterprise: FeatureValue;
}

interface FeatureCategory {
  key: string;
  features: Feature[];
}

const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    key: 'usageLimits',
    features: [
      { key: 'monthlyEvents', growth: 'range', professional: 'range', enterprise: 'custom' },
      { key: 'sites', growth: 'upTo2', professional: 'upTo50', enterprise: 'unlimited' },
      { key: 'dataRetention', growth: '1year', professional: '3years', enterprise: '5years' },
    ],
  },
  {
    key: 'analytics',
    features: [
      { key: 'dashboardFeatures', growth: true, professional: true, enterprise: true },
      { key: 'funnels', growth: true, professional: true, enterprise: true },
      { key: 'userJourneys', growth: true, professional: true, enterprise: true },
      { key: 'customEvents', growth: true, professional: true, enterprise: true },
      { key: 'webVitals', growth: true, professional: true, enterprise: true },
      { key: 'campaignTracking', growth: true, professional: true, enterprise: true },
      { key: 'sessionReplay', growth: true, professional: true, enterprise: true },
      { key: 'emailReports', growth: false, professional: true, enterprise: true },
    ],
  },
  {
    key: 'observability',
    features: [
      { key: 'uptimeMonitoring', growth: '1', professional: '50', enterprise: 'unlimited' },
      { key: 'checkInterval', growth: '5min', professional: '1min', enterprise: '1min' },
      { key: 'sslMonitoring', growth: true, professional: true, enterprise: true },
      { key: 'customHttpMethods', growth: false, professional: true, enterprise: true },
      { key: 'customRequestHeaders', growth: false, professional: true, enterprise: true },
      { key: 'customStatusCodes', growth: false, professional: true, enterprise: true },
    ],
  },
  {
    key: 'support',
    features: [
      { key: 'emailSupport', growth: true, professional: true, enterprise: true },
      { key: 'prioritySupport', growth: false, professional: true, enterprise: true },
      { key: 'dedicatedSupport', growth: false, professional: false, enterprise: true },
      { key: 'slaGuarantee', growth: false, professional: false, enterprise: true },
    ],
  },
];

export function FeatureComparisonSection() {
  const t = useTranslations('pricingComparison');
  const td = (key: string) => t(key as Parameters<typeof t>[0]);
  const locale = useLocale();

  const formatEventRange = () => {
    const min = formatNumber(10_000, locale, { maximumFractionDigits: 0 });
    const max = formatNumber(10_000_000, locale, { maximumFractionDigits: 0 });
    return `${min} – ${max}+`;
  };

  const categories = FEATURE_CATEGORIES.map((category) => ({
    name: td(`categories.${category.key}`),
    features: category.features.map((feature) => ({
      name: td(`features.${feature.key}.name`),
      values: TIERS.map((tier) => {
        const value = feature[tier];
        if (typeof value !== 'string') return value;
        if (feature.key === 'monthlyEvents' && value === 'range') {
          return formatEventRange();
        }
        return td(`features.${feature.key}.values.${value}`);
      }),
    })),
  }));

  const columns = TIERS.map((tier) => ({
    label: tier.charAt(0).toUpperCase() + tier.slice(1),
    highlight: tier === 'professional',
  }));

  return <ComparisonTable categories={categories} columns={columns} featureColumnLabel={t('headers.features')} />;
}
