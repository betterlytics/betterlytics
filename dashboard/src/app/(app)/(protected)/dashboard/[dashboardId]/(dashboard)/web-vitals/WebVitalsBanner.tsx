'use client';
import { useEffect } from 'react';
import { useBannerContext } from '@/contexts/BannerProvider';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { trpc } from '@/trpc/client';

export function WebVitalsBanner() {
  const dashboardId = useDashboardId();
  const { data: hasData } = trpc.webVitals.hasData.useQuery({ dashboardId });
  const t = useTranslations('banners.webVitalsNoData');
  const { addBanner, removeBanner } = useBannerContext();

  useEffect(() => {
    if (hasData === false) {
      addBanner({
        id: 'no-web-vitals-data',
        level: 'warning',
        title: t('title'),
        description: t('description'),
        action: (
          <Button
            variant='default'
            className='text-primary-foreground cursor-pointer border-1 border-white bg-amber-600/50 shadow-md hover:bg-amber-600/20'
            onClick={() => {
              window.open('https://betterlytics.io/docs/integration/web-vitals', '_blank');
            }}
          >
            {t('action')}
          </Button>
        ),
        dismissible: true,
      });
    } else if (hasData !== undefined) {
      removeBanner('no-web-vitals-data');
    }
  }, [hasData, t]);

  return null;
}
