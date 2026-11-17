'use client';
import { useEffect } from 'react';
import { useBannerContext } from '@/contexts/BannerProvider';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { trpc } from '@/trpc/client';

export function HeatmapsBanner() {
  const dashboardId = useDashboardId();
  const { data: hasData } = trpc.clickHeatmap.hasData.useQuery({ dashboardId });
  const t = useTranslations('banners.heatmapsNoData');
  const { addBanner, removeBanner } = useBannerContext();

  useEffect(() => {
    if (hasData === false) {
      addBanner({
        id: 'no-heatmap-data',
        level: 'warning',
        title: t('title'),
        description: t('description'),
        action: (
          <Button
            variant='default'
            className='text-primary-foreground cursor-pointer border-1 border-white bg-amber-600/50 shadow-md hover:bg-amber-600/20'
            onClick={() => {
              window.open('https://betterlytics.io/docs/integration/heatmaps', '_blank');
            }}
          >
            {t('action')}
          </Button>
        ),
        dismissible: true,
      });
    } else if (hasData !== undefined) {
      removeBanner('no-heatmap-data');
    }
  }, [hasData, t]);

  return null;
}
