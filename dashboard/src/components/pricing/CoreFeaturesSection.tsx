'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

const CORE_FEATURES = [
  'realtimeAnalytics',
  'sessionReplay',
  'geographicInsights',
  'trafficSources',
  'utmCampaigns',
  'customEvents',
  'funnels',
  'userJourneys',
  'webVitals',
  'botFiltering',
  'outboundLinks',
  'advancedFiltering',
  'cookieFree',
  'gdprCcpa',
] as const;

export function CoreFeaturesSection() {
  const t = useTranslations('pricingComparison.coreFeatures');

  return (
    <div className='border-border/50 bg-card/30 rounded-xl border p-6 backdrop-blur-sm'>
      <div className='mb-6 text-center'>
        <h3 className='text-lg font-semibold'>{t('title')}</h3>
        <p className='text-muted-foreground mt-1 text-sm'>{t('subtitle')}</p>
      </div>

      <div className='flex flex-wrap justify-center gap-3'>
        {CORE_FEATURES.map((feature) => (
          <div
            key={feature}
            className='bg-muted/50 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm'
          >
            <Check className='h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400' strokeWidth={2.5} />
            <span className='text-foreground/80'>{t(`items.${feature}`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
