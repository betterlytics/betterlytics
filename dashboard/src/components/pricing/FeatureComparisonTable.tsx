'use client';

import { useTranslations } from 'next-intl';
import { Check, X, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type FeatureValue = boolean | string | 'partial';
type Tier = (typeof TIERS)[number];

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
      { key: 'sites', growth: '2', professional: 'upTo50', enterprise: 'unlimited' },
      { key: 'dataRetention', growth: '1year', professional: '3years', enterprise: '5years' },
      // { key: 'teamMembers', growth: '1', professional: 'upTo5', enterprise: 'unlimited' },
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
    ],
  },
  {
    key: 'observability',
    features: [
      { key: 'uptimeMonitoring', growth: '5', professional: '50', enterprise: 'unlimited' },
      { key: 'sslMonitoring', growth: true, professional: true, enterprise: true },
      { key: 'advancedIntervals', growth: false, professional: true, enterprise: true },
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

const TIERS = ['growth', 'professional', 'enterprise'] as const;

const ICON_STYLES: Record<'true' | 'false' | 'partial', { Icon: LucideIcon; bg: string; text: string }> = {
  true: { Icon: Check, bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
  false: { Icon: X, bg: 'bg-gray-500/10', text: 'text-muted-foreground/50' },
  partial: { Icon: Minus, bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' },
};

function FeatureValueCell({ value, translatedValue }: { value: FeatureValue; translatedValue?: string }) {
  const iconKey = typeof value === 'boolean' ? String(value) : value;
  const style = ICON_STYLES[iconKey as keyof typeof ICON_STYLES];

  if (style) {
    const { Icon, bg, text } = style;
    return (
      <div className='flex justify-center'>
        <div className={cn('flex h-6 w-6 items-center justify-center rounded-full', bg)}>
          <Icon className={cn('h-4 w-4', text)} strokeWidth={value === false ? 2 : 2.5} />
        </div>
      </div>
    );
  }

  return <span className='text-foreground/80 text-sm font-medium'>{translatedValue || value}</span>;
}

function TierLabel({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <span
      className={cn(
        'font-semibold capitalize',
        tier === 'professional' && 'text-blue-600 dark:text-blue-400',
        className,
      )}
    >
      {tier}
    </span>
  );
}

function getTranslatedValue(feature: Feature, tier: Tier, translate: (key: string) => string): string | undefined {
  const value = feature[tier];
  return typeof value === 'string' ? translate(`features.${feature.key}.values.${value}`) : undefined;
}

export function FeatureComparisonTable() {
  const t = useTranslations('pricingComparison');
  const td = (key: string) => t(key as Parameters<typeof t>[0]);

  return (
    <div className='border-border/50 bg-card/30 overflow-hidden rounded-xl border backdrop-blur-sm'>
      {/* Desktop */}
      <table className='hidden w-full md:table'>
        <thead>
          <tr className='border-border/50 bg-muted/30 border-b'>
            <th className='px-6 py-4 text-left'>
              <span className='text-muted-foreground text-sm font-medium'>{t('headers.features')}</span>
            </th>
            {TIERS.map((tier) => (
              <th key={tier} className='px-6 py-4 text-center'>
                <TierLabel tier={tier} className='text-sm' />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_CATEGORIES.map((category) => (
            <>
              <tr key={`category-${category.key}`} className='border-border/50 bg-muted/20 border-t'>
                <td colSpan={4} className='px-6 py-3'>
                  <span className='text-foreground text-sm font-semibold'>{td(`categories.${category.key}`)}</span>
                </td>
              </tr>
              {category.features.map((feature, idx) => (
                <tr
                  key={`${category.key}-${feature.key}`}
                  className={cn(
                    'hover:bg-muted/20 transition-colors',
                    idx !== category.features.length - 1 && 'border-border/30 border-b',
                  )}
                >
                  <td className='px-6 py-3.5'>
                    <span className='text-foreground/80 text-sm'>{td(`features.${feature.key}.name`)}</span>
                  </td>
                  {TIERS.map((tier) => (
                    <td key={tier} className='px-6 py-3.5 text-center'>
                      <FeatureValueCell
                        value={feature[tier]}
                        translatedValue={getTranslatedValue(feature, tier, td)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>

      {/* Mobile */}
      <div className='md:hidden'>
        <div className='border-border/50 bg-muted/30 grid grid-cols-3 gap-2 border-b px-4 py-3'>
          {TIERS.map((tier) => (
            <div key={tier} className='text-center'>
              <TierLabel tier={tier} className='text-xs' />
            </div>
          ))}
        </div>

        {FEATURE_CATEGORIES.map((category) => (
          <div key={category.key} className='border-border/50 border-b last:border-b-0'>
            <div className='bg-muted/30 px-4 py-3'>
              <h3 className='text-foreground text-sm font-semibold'>{td(`categories.${category.key}`)}</h3>
            </div>
            <div className='divide-border/30 divide-y'>
              {category.features.map((feature) => (
                <div key={feature.key} className='px-4 py-3'>
                  <div className='text-foreground/80 mb-2 text-sm font-medium'>
                    {td(`features.${feature.key}.name`)}
                  </div>
                  <div className='grid grid-cols-3 gap-2 text-center'>
                    {TIERS.map((tier) => (
                      <FeatureValueCell
                        key={tier}
                        value={feature[tier]}
                        translatedValue={getTranslatedValue(feature, tier, td)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
