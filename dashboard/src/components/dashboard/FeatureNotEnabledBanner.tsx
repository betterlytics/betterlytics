'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useBannerContext } from '@/contexts/BannerProvider';

export type NotEnabledFeature =
  'monitoring' | 'statusPages' | 'statusPagesRequireMonitoring' | 'sessionReplay' | 'geography';

type FeatureNotEnabledBannerProps = {
  feature: NotEnabledFeature;
};

/**
 * Page banner for features a self-host operator can switch on through instance configuration.
 */
export function FeatureNotEnabledBanner({ feature }: FeatureNotEnabledBannerProps) {
  const t = useTranslations('banners.featureNotEnabled');
  const { addBanner } = useBannerContext();

  useEffect(() => {
    addBanner({
      id: `feature-not-enabled-${feature}`,
      level: 'warning',
      title: t(`${feature}.title`),
      description: t(`${feature}.description`),
      action: (
        <Button
          variant='default'
          className='text-primary-foreground cursor-pointer border-1 border-white bg-amber-600/50 shadow-md hover:bg-amber-600/20'
          onClick={() => {
            window.open('https://betterlytics.io/docs/installation/self-hosting', '_blank');
          }}
        >
          {t('action')}
        </Button>
      ),
      dismissible: true,
    });
  }, [feature, t, addBanner]);

  return null;
}
